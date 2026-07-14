import { readFileSync } from 'node:fs';

/**
 * Orval input transformer — runs on the spec BEFORE orval resolves it. Two
 * jobs:
 *
 * 1. **Operation selection.** `openapi/selection.json` (managed by
 *    `pnpm gen:api:pick`) lists the operations whose models we generate.
 *    We prune `paths` to that set, then prune `components.*` to only what
 *    those operations transitively `$ref`. (Orval emits every component
 *    schema unless the reachable set is narrowed here — replacing orval's
 *    coarser tag-level `filters` with per-endpoint control.) Deterministic
 *    for CI: the selection file is committed, so `gen:api` needs no
 *    interactive step.
 *
 * 2. **Defect sanitation.** Empty `enum: []` arrays (e.g.
 *    ProductDetailResDto.manufactureYear) are invalid OpenAPI; drop them so
 *    the field falls back to its base type. Report upstream — the NestJS
 *    decorator likely receives an empty list.
 */

const SELECTION_URL = new URL('../openapi/selection.json', import.meta.url);
const HTTP_METHODS = [
  'get',
  'put',
  'post',
  'delete',
  'options',
  'head',
  'patch',
  'trace',
];

/** Read the committed operation selection as a Set of `METHOD /path` keys. */
function loadSelection() {
  let raw;
  try {
    raw = readFileSync(SELECTION_URL, 'utf8');
  } catch {
    throw new Error(
      'gen:api: openapi/selection.json not found. Run `pnpm gen:api:pick` to choose which API operations to generate.',
    );
  }
  const parsed = JSON.parse(raw);
  const operations = parsed?.operations;
  if (!Array.isArray(operations) || operations.length === 0) {
    throw new Error(
      'gen:api: openapi/selection.json has no operations selected. Run `pnpm gen:api:pick`.',
    );
  }
  return new Set(operations);
}

/** Keep only the selected operations; drop paths left with none. */
function pruneToSelection(spec, selection) {
  const paths = spec.paths ?? {};
  for (const [path, item] of Object.entries(paths)) {
    let kept = 0;
    for (const method of HTTP_METHODS) {
      if (!item[method]) continue;
      if (selection.has(`${method.toUpperCase()} ${path}`)) {
        kept += 1;
      } else {
        delete item[method];
      }
    }
    // A path object with no operations left contributes nothing.
    if (kept === 0) delete paths[path];
  }
}

/** Collect every `#/components/...` $ref string reachable in a subtree. */
function collectRefs(node, out) {
  if (Array.isArray(node)) {
    for (const child of node) collectRefs(child, out);
    return;
  }
  if (node && typeof node === 'object') {
    if (
      typeof node.$ref === 'string' &&
      node.$ref.startsWith('#/components/')
    ) {
      out.add(node.$ref);
    }
    for (const value of Object.values(node)) collectRefs(value, out);
  }
}

/**
 * Drop component entries not transitively referenced by the (already pruned)
 * paths — a BFS over `$ref`s. Without this, orval emits ALL component schemas
 * regardless of which operations survive.
 */
function pruneUnreachableComponents(spec) {
  const components = spec.components;
  if (!components) return;

  const seed = new Set();
  collectRefs(spec.paths ?? {}, seed);

  const reachable = new Set();
  const queue = [...seed];
  while (queue.length > 0) {
    const ref = queue.pop();
    if (reachable.has(ref)) continue;
    reachable.add(ref);
    const match = /^#\/components\/([^/]+)\/(.+)$/.exec(ref);
    if (!match) continue;
    const target = components[match[1]]?.[match[2]];
    if (!target) continue;
    const childRefs = new Set();
    collectRefs(target, childRefs);
    for (const childRef of childRefs) queue.push(childRef);
  }

  for (const [section, items] of Object.entries(components)) {
    if (!items || typeof items !== 'object') continue;
    for (const name of Object.keys(items)) {
      if (!reachable.has(`#/components/${section}/${name}`)) delete items[name];
    }
  }
}

/** Drop invalid empty enums anywhere in the tree. */
function sanitizeEmptyEnums(node) {
  if (Array.isArray(node)) {
    node.forEach(sanitizeEmptyEnums);
    return;
  }
  if (node && typeof node === 'object') {
    if (Array.isArray(node.enum) && node.enum.length === 0) {
      delete node.enum;
    }
    Object.values(node).forEach(sanitizeEmptyEnums);
  }
}

export default function transformer(spec) {
  pruneToSelection(spec, loadSelection());
  pruneUnreachableComponents(spec);
  sanitizeEmptyEnums(spec);
  return spec;
}
