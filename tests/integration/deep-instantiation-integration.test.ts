import { createSourceFile, formatWithPrettier, generateFormattedCode } from '@test-fixtures/utils'
import { beforeEach, describe, expect, test } from 'bun:test'
import { Project } from 'ts-morph'

describe('Deep Instantiation Integration', () => {
  let project: Project

  beforeEach(() => {
    project = new Project()
  })

  test('should generate code without deep Instantiation', () => {
    const sourceFile = createSourceFile(
      project,
      `
        type A = 'aa' | 'ab' | 'ac' | 'ad' | 'ae' | 'af' | 'ag' | 'ah' | 'ai' | 'aj'
        type B = Record<A, string>
      `,
    )

    expect(generateFormattedCode(sourceFile)).toBe(
      formatWithPrettier(
        `
          export const A = Type.Union([
            Type.Literal('aa'),
            Type.Literal('ab'),
            Type.Literal('ac'),
            Type.Literal('ad'),
            Type.Literal('ae'),
            Type.Literal('af'),
            Type.Literal('ag'),
            Type.Literal('ah'),
            Type.Literal('ai'),
            Type.Literal('aj'),
          ]);

          export type A = Static<typeof A>

          export const B = Type.Record(A, Type.String())

          export type B = Static<typeof B>
        `,
      ),
    )
  })

  test('should generate code with deep instantiation 1', () => {
    const sourceFile = createSourceFile(
      project,
      `
        type A = 'aa' | 'ab' | 'ac' | 'ad' | 'ae' | 'af' | 'ag' | 'ah' | 'ai' | 'aj'
                    | 'ak' | 'al' | 'am' | 'an' | 'ao' | 'ap' | 'aq' | 'ar' | 'as' | 'at'
                    | 'au' | 'av' | 'aw' | 'ax' | 'ay' | 'az' | 'ba' | 'bb' | 'bc' | 'bd'
                    | 'be' | 'bf' | 'bg' | 'bh' | 'bi' | 'bj' | 'bk' | 'bl' | 'bm' | 'bn'
                    | 'bo' | 'bp' | 'bq' | 'br' | 'bs' | 'bt' | 'bu' | 'bv' | 'bw' | 'bx'
                    | 'by' | 'bz' | 'ca' | 'cb' | 'cc' | 'cd' | 'ce' | 'cf' | 'cg' | 'ch'
                    | 'ci' | 'cj' | 'ck' | 'cl' | 'cm' | 'cn' | 'co' | 'cp' | 'cq' | 'cr'
                    | 'cs' | 'ct' | 'cu' | 'cv' | 'cw' | 'cx' | 'cy' | 'cz'

        type B = Partial<Record<A, string>>
      `,
    )

    expect(generateFormattedCode(sourceFile)).toBe(
      formatWithPrettier(
        `
          const A_Chunk1 = Type.Union([
            Type.Literal('aa'),
            Type.Literal('ab'),
            Type.Literal('ac'),
            Type.Literal('ad'),
            Type.Literal('ae'),
            Type.Literal('af'),
            Type.Literal('ag'),
            Type.Literal('ah'),
            Type.Literal('ai'),
            Type.Literal('aj'),
            Type.Literal('ak'),
            Type.Literal('al'),
            Type.Literal('am'),
            Type.Literal('an'),
            Type.Literal('ao'),
            Type.Literal('ap'),
            Type.Literal('aq'),
            Type.Literal('ar'),
            Type.Literal('as'),
            Type.Literal('at'),
          ]);
          const A_Chunk2 = Type.Union([
            Type.Literal('au'),
            Type.Literal('av'),
            Type.Literal('aw'),
            Type.Literal('ax'),
            Type.Literal('ay'),
            Type.Literal('az'),
            Type.Literal('ba'),
            Type.Literal('bb'),
            Type.Literal('bc'),
            Type.Literal('bd'),
            Type.Literal('be'),
            Type.Literal('bf'),
            Type.Literal('bg'),
            Type.Literal('bh'),
            Type.Literal('bi'),
            Type.Literal('bj'),
            Type.Literal('bk'),
            Type.Literal('bl'),
            Type.Literal('bm'),
            Type.Literal('bn'),
          ]);
          const A_Chunk3 = Type.Union([
            Type.Literal('bo'),
            Type.Literal('bp'),
            Type.Literal('bq'),
            Type.Literal('br'),
            Type.Literal('bs'),
            Type.Literal('bt'),
            Type.Literal('bu'),
            Type.Literal('bv'),
            Type.Literal('bw'),
            Type.Literal('bx'),
            Type.Literal('by'),
            Type.Literal('bz'),
            Type.Literal('ca'),
            Type.Literal('cb'),
            Type.Literal('cc'),
            Type.Literal('cd'),
            Type.Literal('ce'),
            Type.Literal('cf'),
            Type.Literal('cg'),
            Type.Literal('ch'),
          ]);
          const A_Chunk4 = Type.Union([
            Type.Literal('ci'),
            Type.Literal('cj'),
            Type.Literal('ck'),
            Type.Literal('cl'),
            Type.Literal('cm'),
            Type.Literal('cn'),
            Type.Literal('co'),
            Type.Literal('cp'),
            Type.Literal('cq'),
            Type.Literal('cr'),
            Type.Literal('cs'),
            Type.Literal('ct'),
            Type.Literal('cu'),
            Type.Literal('cv'),
            Type.Literal('cw'),
            Type.Literal('cx'),
            Type.Literal('cy'),
            Type.Literal('cz'),
          ]);
          export const A = Type.Union([
            A_Chunk1,
            A_Chunk2,
            A_Chunk3,
            A_Chunk4,
          ]);

          export type A = Static<typeof A>;

          export const B = Type.Partial(
            Type.Intersect([
              Type.Record(A_Chunk1, Type.String()),
              Type.Record(A_Chunk2, Type.String()),
              Type.Record(A_Chunk3, Type.String()),
              Type.Record(A_Chunk4, Type.String()),
            ]),
          );

          export type B = Static<typeof B>;
        `,
      ),
    )
  })

  test('should generate code with deep instantiation 2', () => {
    const sourceFile = createSourceFile(
      project,
      `
        type A = 'aa' | 'ab' | 'ac' | 'ad' | 'ae' | 'af' | 'ag' | 'ah' | 'ai' | 'aj'
                    | 'ak' | 'al' | 'am' | 'an' | 'ao' | 'ap' | 'aq' | 'ar' | 'as' | 'at'
                    | 'au' | 'av' | 'aw' | 'ax' | 'ay' | 'az' | 'ba' | 'bb' | 'bc' | 'bd'
                    | 'be' | 'bf' | 'bg' | 'bh' | 'bi' | 'bj' | 'bk' | 'bl' | 'bm' | 'bn'
                    | 'bo' | 'bp' | 'bq' | 'br' | 'bs' | 'bt' | 'bu' | 'bv' | 'bw' | 'bx'
                    | 'by' | 'bz' | 'ca' | 'cb' | 'cc' | 'cd' | 'ce' | 'cf' | 'cg' | 'ch'
                    | 'ci' | 'cj' | 'ck' | 'cl' | 'cm' | 'cn' | 'co' | 'cp' | 'cq' | 'cr'
                    | 'cs' | 'ct' | 'cu' | 'cv' | 'cw' | 'cx' | 'cy' | 'cz' | number

        type B = Record<A, string>
      `,
    )

    expect(generateFormattedCode(sourceFile)).toBe(
      formatWithPrettier(
        `
          const A_Chunk1 = Type.Union([
            Type.Literal('aa'),
            Type.Literal('ab'),
            Type.Literal('ac'),
            Type.Literal('ad'),
            Type.Literal('ae'),
            Type.Literal('af'),
            Type.Literal('ag'),
            Type.Literal('ah'),
            Type.Literal('ai'),
            Type.Literal('aj'),
            Type.Literal('ak'),
            Type.Literal('al'),
            Type.Literal('am'),
            Type.Literal('an'),
            Type.Literal('ao'),
            Type.Literal('ap'),
            Type.Literal('aq'),
            Type.Literal('ar'),
            Type.Literal('as'),
            Type.Literal('at'),
          ]);
          const A_Chunk2 = Type.Union([
            Type.Literal('au'),
            Type.Literal('av'),
            Type.Literal('aw'),
            Type.Literal('ax'),
            Type.Literal('ay'),
            Type.Literal('az'),
            Type.Literal('ba'),
            Type.Literal('bb'),
            Type.Literal('bc'),
            Type.Literal('bd'),
            Type.Literal('be'),
            Type.Literal('bf'),
            Type.Literal('bg'),
            Type.Literal('bh'),
            Type.Literal('bi'),
            Type.Literal('bj'),
            Type.Literal('bk'),
            Type.Literal('bl'),
            Type.Literal('bm'),
            Type.Literal('bn'),
          ]);
          const A_Chunk3 = Type.Union([
            Type.Literal('bo'),
            Type.Literal('bp'),
            Type.Literal('bq'),
            Type.Literal('br'),
            Type.Literal('bs'),
            Type.Literal('bt'),
            Type.Literal('bu'),
            Type.Literal('bv'),
            Type.Literal('bw'),
            Type.Literal('bx'),
            Type.Literal('by'),
            Type.Literal('bz'),
            Type.Literal('ca'),
            Type.Literal('cb'),
            Type.Literal('cc'),
            Type.Literal('cd'),
            Type.Literal('ce'),
            Type.Literal('cf'),
            Type.Literal('cg'),
            Type.Literal('ch'),
          ]);
          const A_Chunk4 = Type.Union([
            Type.Literal('ci'),
            Type.Literal('cj'),
            Type.Literal('ck'),
            Type.Literal('cl'),
            Type.Literal('cm'),
            Type.Literal('cn'),
            Type.Literal('co'),
            Type.Literal('cp'),
            Type.Literal('cq'),
            Type.Literal('cr'),
            Type.Literal('cs'),
            Type.Literal('ct'),
            Type.Literal('cu'),
            Type.Literal('cv'),
            Type.Literal('cw'),
            Type.Literal('cx'),
            Type.Literal('cy'),
            Type.Literal('cz'),
            Type.Number(),
          ]);
          export const A = Type.Union([
            A_Chunk1,
            A_Chunk2,
            A_Chunk3,
            A_Chunk4,
          ]);

          export type A = Static<typeof A>;

          export const B = Type.Intersect([
            Type.Record(A_Chunk1, Type.String()),
            Type.Record(A_Chunk2, Type.String()),
            Type.Record(A_Chunk3, Type.String()),
            Type.Record(A_Chunk4, Type.String()),
          ]);

          export type B = Static<typeof B>;
        `,
      ),
    )
  })

  test('should generate code with deep instantiation 3', () => {
    const sourceFile = createSourceFile(
      project,
      `
          type A = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
                      | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20
                      | string

          type B = Record<A, string>
      `,
    )

    expect(generateFormattedCode(sourceFile)).toBe(
      formatWithPrettier(
        `
          const A_Chunk1 = Type.Union([
            Type.Literal(1),
            Type.Literal(2),
            Type.Literal(3),
            Type.Literal(4),
            Type.Literal(5),
            Type.Literal(6),
            Type.Literal(7),
            Type.Literal(8),
            Type.Literal(9),
            Type.Literal(10),
            Type.Literal(11),
            Type.Literal(12),
            Type.Literal(13),
            Type.Literal(14),
            Type.Literal(15),
            Type.Literal(16),
            Type.Literal(17),
            Type.Literal(18),
            Type.Literal(19),
            Type.Literal(20),
          ]);
          const A_Chunk2 = Type.String();
          export const A = Type.Union([
            A_Chunk1,
            A_Chunk2,
          ]);

          export type A = Static<typeof A>;

          export const B = Type.Intersect([
            Type.Record(A_Chunk1, Type.String()),
            Type.Record(A_Chunk2, Type.String()),
          ]);

          export type B = Static<typeof B>;
        `,
      ),
    )
  })
})
