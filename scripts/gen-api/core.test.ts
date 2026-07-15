import { describe, expect, it } from 'vitest';
import { generateModels, type OpenApiSpec } from './core';

/** Minimal spec factory — each test states only what it exercises. */
function spec(
  schemas: Record<string, unknown>,
  paths?: Record<string, unknown>,
): OpenApiSpec {
  return {
    info: { title: 'Fixture API', version: '9.9.9' },
    paths: (paths ?? {
      '/things': {
        get: {
          responses: {
            '200': {
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ThingDto' },
                },
              },
            },
          },
        },
      },
    }) as OpenApiSpec['paths'],
    components: { schemas: schemas as never },
  };
}

const SELECT_THINGS = new Set(['GET /things']);

describe('generateModels', () => {
  it('emits only schemas reachable from the selected operations', () => {
    const { content, stats } = generateModels(
      spec({
        ThingDto: {
          type: 'object',
          properties: { child: { $ref: '#/components/schemas/ChildDto' } },
        },
        ChildDto: { type: 'object', properties: { id: { type: 'string' } } },
        OrphanDto: { type: 'object', properties: { x: { type: 'string' } } },
      }),
      SELECT_THINGS,
    );
    expect(content).toContain('export interface ThingDto');
    expect(content).toContain('export interface ChildDto');
    expect(content).not.toContain('OrphanDto');
    expect(stats.schemas).toBe(2);
  });

  it('deduplicates identical inline enums into ONE named type (config-named)', () => {
    const role = { type: 'string', enum: ['admin', 'member'] };
    const { content, stats } = generateModels(
      spec({
        ThingDto: {
          type: 'object',
          properties: {
            role,
            owner: { $ref: '#/components/schemas/OwnerDto' },
          },
        },
        OwnerDto: { type: 'object', properties: { role: { ...role } } },
      }),
      SELECT_THINGS,
      { enumNames: { role: 'UserRole' } },
    );
    // One const + type pair, referenced from both DTOs.
    expect(content.match(/export const UserRole/g)).toHaveLength(1);
    expect(content).toContain('role?: UserRole;');
    expect(content).not.toContain('ThingDtoRole'); // the orval-style name
    expect(stats.dedupedSites).toBe(1);
  });

  it('defaults enum names to the PascalCase property name', () => {
    const { content } = generateModels(
      spec({
        ThingDto: {
          type: 'object',
          properties: {
            payment_kind: { type: 'string', enum: ['cash', 'card'] },
          },
        },
      }),
      SELECT_THINGS,
    );
    expect(content).toContain('export const PaymentKind');
    expect(content).toContain('payment_kind?: PaymentKind;');
  });

  it('reuses a component-level enum instead of minting a duplicate', () => {
    const { content } = generateModels(
      spec({
        ThingDto: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['on', 'off'] },
            other: { $ref: '#/components/schemas/Power' },
          },
        },
        Power: { type: 'string', enum: ['on', 'off'] },
      }),
      SELECT_THINGS,
    );
    expect(content.match(/export const Power/g)).toHaveLength(1);
    expect(content).toContain('status?: Power;');
    expect(content).not.toContain('export const Status');
  });

  it('errors on an enum-name collision instead of guessing', () => {
    expect(() =>
      generateModels(
        spec({
          ThingDto: {
            type: 'object',
            properties: {
              kind: { type: 'string', enum: ['a'] },
              other: { $ref: '#/components/schemas/Kind' },
            },
          },
          Kind: { type: 'object', properties: { x: { type: 'string' } } },
        }),
        SELECT_THINGS,
      ),
    ).toThrow(/collides|codegen.json/);
  });

  it('handles required/optional, nullable, arrays, allOf, oneOf and formats', () => {
    const { content } = generateModels(
      spec({
        ThingDto: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
            note: { type: 'string', nullable: true },
            tags: { type: 'array', items: { type: 'string' } },
            createdAt: { type: 'string', format: 'date-time' },
            combo: {
              allOf: [
                { $ref: '#/components/schemas/ChildDto' },
                { type: 'object', properties: { n: { type: 'number' } } },
              ],
            },
            either: { oneOf: [{ type: 'string' }, { type: 'number' }] },
          },
        },
        ChildDto: { type: 'object', properties: { id: { type: 'string' } } },
      }),
      SELECT_THINGS,
    );
    expect(content).toContain('id: string;'); // required → no `?`
    expect(content).toContain('note?: string | null;');
    expect(content).toContain('tags?: string[];');
    expect(content).toContain('/** Format: date-time. */');
    expect(content).toContain('combo?: ChildDto & {');
    expect(content).toContain('either?: string | number;');
  });

  it('fails loudly on unsupported constructs and stale selections', () => {
    expect(() =>
      generateModels(
        spec({
          ThingDto: {
            type: 'object',
            properties: { weird: { anyOf: [{ type: 'string' }] } },
          },
        }),
        SELECT_THINGS,
      ),
    ).toThrow(/anyOf/);
    expect(() => generateModels(spec({}), new Set(['GET /gone']))).toThrow(
      /no longer has|re-select/,
    );
  });

  it('generates the whole spec when selection is \'all\' (operations: "*")', () => {
    const { content, stats } = generateModels(
      spec(
        {
          ThingDto: { type: 'object', properties: { id: { type: 'string' } } },
          OtherDto: { type: 'object', properties: { id: { type: 'string' } } },
        },
        {
          '/things': {
            get: {
              responses: {
                '200': {
                  content: {
                    'application/json': {
                      schema: { $ref: '#/components/schemas/ThingDto' },
                    },
                  },
                },
              },
            },
          },
          '/others': {
            post: {
              requestBody: {
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/OtherDto' },
                  },
                },
              },
            },
          },
        },
      ),
      'all',
    );
    expect(content).toContain('export interface ThingDto');
    expect(content).toContain('export interface OtherDto');
    expect(content).toContain('scope: full spec (2 operations)');
    expect(stats.schemas).toBe(2);
  });

  it('emits numeric enums as a plain union (numbers cannot be const-object keys)', () => {
    const { content } = generateModels(
      spec({
        ThingDto: {
          type: 'object',
          properties: { level: { type: 'number', enum: [1, 2, 3] } },
        },
      }),
      SELECT_THINGS,
    );
    expect(content).toContain('export type Level = 1 | 2 | 3;');
    expect(content).not.toContain('export const Level');
    expect(content).toContain('level?: Level;');
  });

  it('treats a null enum member as nullability, not a value', () => {
    const { content } = generateModels(
      spec({
        ThingDto: {
          type: 'object',
          properties: { mood: { type: 'string', enum: ['up', 'down', null] } },
        },
      }),
      SELECT_THINGS,
    );
    expect(content).toContain("up: 'up',");
    // null must surface as `| null` on the property, never as an enum member.
    expect(content).not.toMatch(/null:|'null'/);
    expect(content).toContain('mood?: Mood | null;');
  });

  it('errors when two DIFFERENT value-sets contest the same default name', () => {
    expect(() =>
      generateModels(
        spec({
          ThingDto: {
            type: 'object',
            properties: {
              kind: { type: 'string', enum: ['a'] },
              other: { $ref: '#/components/schemas/OtherDto' },
            },
          },
          OtherDto: {
            type: 'object',
            properties: { kind: { type: 'string', enum: ['b'] } },
          },
        }),
        SELECT_THINGS,
      ),
    ).toThrow(/collides|codegen.json/);
  });

  it('escapes `*/` in backend descriptions so the emitted JSDoc cannot break', () => {
    const { content } = generateModels(
      spec({
        ThingDto: {
          type: 'object',
          properties: {
            x: { type: 'string', description: 'weird */ text' },
          },
        },
      }),
      SELECT_THINGS,
    );
    expect(content).toContain('weird *\\/ text');
    expect(content).not.toContain('/** weird */ text */');
  });

  it('emits zod validators mirroring the types (shared enums, optional/nullable, lazy refs)', () => {
    const role = { type: 'string', enum: ['admin', 'member'] };
    const { schemas } = generateModels(
      spec({
        ThingDto: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
            note: { type: 'string', nullable: true },
            role,
            child: { $ref: '#/components/schemas/ChildDto' },
          },
        },
        ChildDto: { type: 'object', properties: { role: { ...role } } },
      }),
      SELECT_THINGS,
      { enumNames: { role: 'UserRole' } },
    );
    expect(schemas).toContain(
      "export const UserRoleSchema = z.enum(['admin', 'member'])",
    );
    expect(schemas).toContain('id: z.string(),'); // required → no .optional()
    expect(schemas).toContain('note: z.string().nullable().optional(),');
    expect(schemas).toContain('role: UserRoleSchema.optional(),'); // shared, not re-inlined
    expect(schemas).toContain(
      'child: z.lazy(() => ChildDtoSchema).optional(),',
    );
    expect(schemas).toContain('satisfies z.ZodType<ThingDto>');
  });

  it('is deterministic: same input → byte-identical output', () => {
    const make = () =>
      generateModels(
        spec({
          BDto: { type: 'object', properties: { x: { type: 'string' } } },
          ThingDto: {
            type: 'object',
            properties: { b: { $ref: '#/components/schemas/BDto' } },
          },
        }),
        SELECT_THINGS,
      ).content;
    expect(make()).toBe(make());
  });
});
