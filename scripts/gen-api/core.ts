/**
 * OpenAPI → TypeScript **model** generator (the whole pipeline, pure — no I/O;
 * `generate.ts` owns files/network). Replaces orval (ADR 0007), which couldn't
 * emit models alone (a quarantined client rode along), fragmented output into
 * one file per schema, named inline enums `<Dto><Prop>` (the same 13-value
 * role enum existed under three names) and emitted a `<Controller><Op>200`
 * wrapper per operation that nothing imported.
 *
 * Principles:
 * - **Selection-driven**: only schemas transitively `$ref`ed by the selected
 *   operations (`openapi/selection.json`) are emitted.
 * - **Enums are deduplicated by value-set** and given domain names via
 *   `openapi/codegen.json` (`enumNames`, keyed by property name); the default
 *   is the PascalCase property name. Ambiguity is an ERROR, never a guess.
 * - **One output file**, alphabetically sorted → deterministic, reviewable
 *   diffs, and `check:api-fresh` keeps working.
 * - **Fail loudly** on OpenAPI constructs this generator does not understand —
 *   a wrong type is worse than no type.
 *
 * Portable: this folder is self-contained (Node + TypeScript only). To reuse
 * in another repo, copy `scripts/gen-api/` and wire the `gen:api` script.
 */

type JsonObject = Record<string, unknown>;

export interface SchemaNode extends JsonObject {
  $ref?: string;
  type?: string;
  enum?: unknown[];
  properties?: Record<string, SchemaNode>;
  required?: string[];
  items?: SchemaNode;
  allOf?: SchemaNode[];
  oneOf?: SchemaNode[];
  anyOf?: SchemaNode[];
  additionalProperties?: SchemaNode | boolean;
  nullable?: boolean;
  description?: string;
  format?: string;
  deprecated?: boolean;
}

export interface OpenApiSpec extends JsonObject {
  info?: { title?: string; version?: string };
  paths?: Record<string, Record<string, unknown>>;
  components?: { schemas?: Record<string, SchemaNode> };
}

export interface CodegenConfig {
  /** Inline-enum names by property name, e.g. `{ "role": "UserRole" }`. */
  enumNames?: Record<string, string>;
}

export const HTTP_METHODS = [
  'get',
  'put',
  'post',
  'delete',
  'options',
  'head',
  'patch',
  'trace',
] as const;

const SCHEMA_REF = /^#\/components\/schemas\/([A-Za-z_$][\w$]*)$/;
const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

function fail(message: string): never {
  throw new Error(`gen:api: ${message}`);
}

// ---------------------------------------------------------------------------
// Selection pruning + reachability (ported from the orval input transformer)
// ---------------------------------------------------------------------------

/** Keep only selected operations; error on selection entries the spec lost. */
function pruneToSelection(spec: OpenApiSpec, selection: Set<string>): void {
  const paths = spec.paths ?? {};
  const found = new Set<string>();
  for (const [path, item] of Object.entries(paths)) {
    let kept = 0;
    for (const method of HTTP_METHODS) {
      if (!(method in item)) continue;
      const key = `${method.toUpperCase()} ${path}`;
      if (selection.has(key)) {
        found.add(key);
        kept += 1;
      } else {
        delete item[method];
      }
    }
    if (kept === 0) delete paths[path];
  }
  const missing = [...selection].filter((key) => !found.has(key));
  if (missing.length > 0) {
    fail(
      `selection.json lists operations the spec no longer has:\n` +
        missing.map((m) => `  ${m}`).join('\n') +
        `\nRun \`pnpm gen:api:pick\` to re-select.`,
    );
  }
}

function collectRefs(node: unknown, out: Set<string>): void {
  if (Array.isArray(node)) {
    for (const child of node) collectRefs(child, out);
    return;
  }
  if (node && typeof node === 'object') {
    const ref = (node as SchemaNode).$ref;
    if (typeof ref === 'string') out.add(ref);
    for (const value of Object.values(node)) collectRefs(value, out);
  }
}

/** Names of component schemas transitively referenced by the pruned paths. */
function reachableSchemaNames(spec: OpenApiSpec): string[] {
  const schemas = spec.components?.schemas ?? {};
  const seed = new Set<string>();
  collectRefs(spec.paths ?? {}, seed);

  const reachable = new Set<string>();
  const queue = [...seed];
  while (queue.length > 0) {
    const ref = queue.pop()!;
    const match = SCHEMA_REF.exec(ref);
    if (!match) fail(`unsupported $ref "${ref}" (only #/components/schemas)`);
    const name = match[1]!;
    if (reachable.has(name)) continue;
    if (!schemas[name]) fail(`$ref to missing schema "${name}"`);
    reachable.add(name);
    const childRefs = new Set<string>();
    collectRefs(schemas[name], childRefs);
    queue.push(...childRefs);
  }
  return [...reachable].sort();
}

/** Invalid `enum: []` (seen in the live spec) → fall back to the base type. */
function sanitizeEmptyEnums(node: unknown): void {
  if (Array.isArray(node)) {
    node.forEach(sanitizeEmptyEnums);
    return;
  }
  if (node && typeof node === 'object') {
    const schema = node as SchemaNode;
    if (Array.isArray(schema.enum) && schema.enum.length === 0) {
      delete schema.enum;
    }
    Object.values(schema).forEach(sanitizeEmptyEnums);
  }
}

// ---------------------------------------------------------------------------
// Enum registry — dedupe inline enums by value-set, name them well
// ---------------------------------------------------------------------------

interface EnumDef {
  name: string;
  /** null (from nullable enums) already stripped. */
  values: (string | number)[];
}

/** Canonical identity of an enum: its value-set, order-insensitive. */
function enumKey(values: (string | number)[]): string {
  return JSON.stringify([...values].sort());
}

function pascalCase(name: string): string {
  const cleaned = name.replace(/[^A-Za-z0-9]+(.)/g, (_, c: string) =>
    c.toUpperCase(),
  );
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/** Site = one inline `enum:` occurrence; `prop` names the enclosing property. */
interface EnumSite {
  schema: SchemaNode;
  prop: string;
  owner: string;
}

function collectEnumSites(
  name: string,
  node: SchemaNode,
  prop: string,
  out: EnumSite[],
): void {
  if (Array.isArray(node.enum)) out.push({ schema: node, prop, owner: name });
  for (const [key, child] of Object.entries(node.properties ?? {})) {
    collectEnumSites(name, child, key, out);
  }
  if (node.items) collectEnumSites(name, node.items, prop, out);
  for (const part of [...(node.allOf ?? []), ...(node.oneOf ?? [])]) {
    collectEnumSites(name, part, prop, out);
  }
  if (typeof node.additionalProperties === 'object') {
    collectEnumSites(name, node.additionalProperties, prop, out);
  }
}

function normalizeEnumValues(site: EnumSite): {
  values: (string | number)[];
  nullable: boolean;
} {
  const raw = site.schema.enum!;
  const values = raw.filter((v): v is string | number => v !== null);
  if (values.some((v) => typeof v !== 'string' && typeof v !== 'number')) {
    fail(`enum on "${site.owner}.${site.prop}" has non-string/number values`);
  }
  return { values, nullable: raw.length !== values.length };
}

/**
 * Build the deduplicated enum registry and tag every inline site with its
 * resolved type name (stored on the schema node for the emitter).
 */
function buildEnumRegistry(
  schemas: Record<string, SchemaNode>,
  names: string[],
  config: CodegenConfig,
): { defs: EnumDef[]; siteCount: number; groupCount: number } {
  const sites: EnumSite[] = [];
  for (const name of names) {
    const schema = schemas[name]!;
    // A component that IS an enum keeps its component name.
    if (Array.isArray(schema.enum)) continue;
    collectEnumSites(name, schema, name, sites);
  }

  const groups = new Map<string, { def: EnumDef; sites: EnumSite[] }>();
  for (const site of sites) {
    const { values } = normalizeEnumValues(site);
    const key = enumKey(values);
    const group = groups.get(key) ?? { def: { name: '', values }, sites: [] };
    group.sites.push(site);
    groups.set(key, group);
  }

  // Every component claims its symbol name up front (a minted enum name must
  // not shadow an interface). Component-level enums additionally claim their
  // value-set, so a matching inline site reuses that name instead of minting
  // a duplicate.
  const taken = new Map<string, string>(); // name -> claimed-by (for errors)
  for (const name of names) {
    const schema = schemas[name]!;
    taken.set(name, `component schema "${name}"`);
    if (!Array.isArray(schema.enum)) continue;
    const values = schema.enum.filter((v): v is string | number => v !== null);
    const group = groups.get(enumKey(values));
    if (group) group.def.name = name;
  }

  const overrides = config.enumNames ?? {};
  const defs: EnumDef[] = [];
  for (const group of groups.values()) {
    if (!group.def.name) {
      const props = [...new Set(group.sites.map((s) => s.prop))];
      const overridden = [
        ...new Set(props.map((p) => overrides[p]).filter(Boolean)),
      ] as string[];
      if (overridden.length > 1) {
        fail(`enumNames overrides disagree for one value-set: ${overridden}`);
      }
      group.def.name = overridden[0] ?? pascalCase(props[0]!);
      const claimedBy = taken.get(group.def.name);
      if (claimedBy) {
        const where = group.sites.map((s) => `${s.owner}.${s.prop}`).join(', ');
        fail(
          `enum name "${group.def.name}" (from ${where}) collides with ` +
            `${claimedBy}. Add a distinct name to enumNames in openapi/codegen.json.`,
        );
      }
      taken.set(group.def.name, `enum at ${group.sites[0]!.owner}`);
      defs.push(group.def);
    }
    // Tag each site so the emitter prints the shared name.
    for (const site of group.sites) {
      const { nullable } = normalizeEnumValues(site);
      site.schema['x-enum-name'] = group.def.name;
      if (nullable) site.schema.nullable = true;
    }
  }
  return {
    defs: defs.sort((a, b) => a.name.localeCompare(b.name)),
    siteCount: sites.length,
    groupCount: groups.size,
  };
}

// ---------------------------------------------------------------------------
// Emission
// ---------------------------------------------------------------------------

function quoteKey(key: string): string {
  return IDENTIFIER.test(key) ? key : `'${key.replace(/'/g, "\\'")}'`;
}

function literal(value: string | number): string {
  return typeof value === 'string'
    ? `'${value.replace(/'/g, "\\'")}'`
    : `${value}`;
}

/** Render a schema node to a TypeScript type expression. */
function tsType(node: SchemaNode, where: string): string {
  const orNull = (t: string) => (node.nullable ? `${t} | null` : t);

  if (node.$ref) {
    const match = SCHEMA_REF.exec(node.$ref);
    if (!match) fail(`unsupported $ref "${node.$ref}" at ${where}`);
    return orNull(match[1]!);
  }
  if (typeof node['x-enum-name'] === 'string') {
    return orNull(node['x-enum-name']);
  }
  if (node.anyOf) fail(`anyOf at ${where} is not supported yet`);
  if (node.allOf) {
    return orNull(
      node.allOf.map((p, i) => tsType(p, `${where}.allOf[${i}]`)).join(' & '),
    );
  }
  if (node.oneOf) {
    return orNull(
      node.oneOf.map((p, i) => tsType(p, `${where}.oneOf[${i}]`)).join(' | '),
    );
  }
  switch (node.type) {
    case 'string':
      return orNull('string');
    case 'integer':
    case 'number':
      return orNull('number');
    case 'boolean':
      return orNull('boolean');
    case 'array':
      if (!node.items) fail(`array without items at ${where}`);
      return orNull(`${tsType(node.items, `${where}[]`)}[]`);
    case 'object':
    case undefined: {
      if (node.properties) return orNull(objectLiteral(node, where));
      if (typeof node.additionalProperties === 'object') {
        const value = tsType(node.additionalProperties, `${where}{}`);
        return orNull(`Record<string, ${value}>`);
      }
      return orNull('Record<string, unknown>');
    }
    default:
      fail(`unsupported type "${node.type}" at ${where}`);
  }
}

function docComment(node: SchemaNode, indent: string): string {
  const parts: string[] = [];
  if (node.description) parts.push(node.description.trim());
  if (node.deprecated) parts.push('@deprecated');
  if (node.format) parts.push(`Format: ${node.format}.`);
  if (parts.length === 0) return '';
  // A description containing `*/` would terminate the comment early and
  // corrupt the emitted file — descriptions are backend-authored free text.
  const safe = parts.join(' ').replace(/\*\//g, '*\\/');
  return `${indent}/** ${safe} */\n`;
}

function objectLiteral(node: SchemaNode, where: string, indent = '  '): string {
  const required = new Set(node.required ?? []);
  const lines = Object.entries(node.properties ?? {}).map(([key, child]) => {
    const optional = required.has(key) ? '' : '?';
    const doc = docComment(child, indent);
    return `${doc}${indent}${quoteKey(key)}${optional}: ${tsType(child, `${where}.${key}`)};`;
  });
  return `{\n${lines.join('\n')}\n${indent.slice(2)}}`;
}

function emitEnum(def: EnumDef): string {
  const type = `export type ${def.name} = (typeof ${def.name})[keyof typeof ${def.name}];`;
  if (def.values.every((v) => typeof v === 'string')) {
    const entries = def.values
      .map((v) => `  ${quoteKey(v as string)}: ${literal(v)},`)
      .join('\n');
    return `export const ${def.name} = {\n${entries}\n} as const;\n${type}`;
  }
  // Numeric values can't be object keys — a plain union is the useful shape.
  return `export type ${def.name} = ${def.values.map(literal).join(' | ')};`;
}

function emitSchema(name: string, schema: SchemaNode): string {
  const doc = docComment(schema, '');
  if (Array.isArray(schema.enum)) {
    const values = schema.enum.filter((v): v is string | number => v !== null);
    return `${doc}${emitEnum({ name, values })}`;
  }
  if (schema.properties) {
    return `${doc}export interface ${name} ${objectLiteral(schema, name)}`;
  }
  return `${doc}export type ${name} = ${tsType(schema, name)};`;
}

// ---------------------------------------------------------------------------
// Entry
// ---------------------------------------------------------------------------

export interface GenerateResult {
  content: string;
  stats: { schemas: number; enums: number; dedupedSites: number };
}

function countOperations(spec: OpenApiSpec): number {
  let count = 0;
  for (const item of Object.values(spec.paths ?? {})) {
    for (const method of HTTP_METHODS) if (method in item) count += 1;
  }
  return count;
}

/**
 * Mutates `spec` (callers pass a freshly parsed copy). `selection` is the set
 * of `METHOD /path` keys to generate for, or `'all'` (selection.json
 * `"operations": "*"`) to generate the full spec.
 */
export function generateModels(
  spec: OpenApiSpec,
  selection: Set<string> | 'all',
  config: CodegenConfig = {},
): GenerateResult {
  let scope: string;
  if (selection === 'all') {
    const count = countOperations(spec);
    if (count === 0) fail('the spec has no operations.');
    scope = `full spec (${count} operations)`;
  } else {
    if (selection.size === 0) {
      fail(
        'selection.json has no operations selected. Run `pnpm gen:api:pick`.',
      );
    }
    pruneToSelection(spec, selection);
    scope = `openapi/selection.json (${selection.size} operations)`;
  }
  sanitizeEmptyEnums(spec);

  const schemas = spec.components?.schemas ?? {};
  const names = reachableSchemaNames(spec);
  for (const name of names) {
    if (!IDENTIFIER.test(name))
      fail(`schema name "${name}" is not a valid identifier`);
  }
  const {
    defs: enums,
    siteCount,
    groupCount,
  } = buildEnumRegistry(schemas, names, config);

  const header = [
    '/**',
    ` * Generated by \`pnpm gen:api\` (scripts/gen-api) — DO NOT EDIT.`,
    ` * Source: ${spec.info?.title ?? 'OpenAPI'} v${spec.info?.version ?? '?'};`,
    ` * scope: ${scope}.`,
    ' */',
  ].join('\n');

  const blocks = [
    header,
    ...enums.map(emitEnum),
    ...names
      .filter((n) => !enums.some((e) => e.name === n))
      .map((n) => emitSchema(n, schemas[n]!)),
  ];

  return {
    content: `${blocks.join('\n\n')}\n`,
    stats: {
      schemas: names.length,
      enums: enums.length,
      dedupedSites: siteCount - groupCount,
    },
  };
}
