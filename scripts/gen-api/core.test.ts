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
