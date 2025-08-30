import { createSourceFile, formatWithPrettier, generateFormattedCode } from '@test-fixtures/utils'
import { beforeEach, describe, expect, test } from 'bun:test'
import { Project } from 'ts-morph'

describe('Readonly types', () => {
  let project: Project

  beforeEach(() => {
    project = new Project()
  })

  describe('Readonly utility type', () => {
    test('simple readonly object', () => {
      const sourceFile = createSourceFile(project, 'type Test = Readonly<{ a: string }>')

      expect(generateFormattedCode(sourceFile)).toBe(
        formatWithPrettier(
          `
            export const Test = Type.Readonly(Type.Object({
              a: Type.String()
            }))

            export type Test = Static<typeof Test>
          `,
        ),
      )
    })

    test('nested readonly types', () => {
      const sourceFile = createSourceFile(
        project,
        'type Test = Partial<Readonly<Record<string, number>>>',
      )

      expect(generateFormattedCode(sourceFile)).toBe(
        formatWithPrettier(
          `
            export const Test = Type.Partial(Type.Readonly(Type.Record(Type.String(), Type.Number())))

            export type Test = Static<typeof Test>
          `,
        ),
      )
    })

    test('generic readonly type', () => {
      const sourceFile = createSourceFile(project, 'type Test<T> = Readonly<T>')

      expect(generateFormattedCode(sourceFile)).toBe(
        formatWithPrettier(
          `
            export const Test = <T extends TSchema>(T: T) => Type.Readonly(T)

            export type Test<T extends TSchema> = Static<ReturnType<typeof Test<T>>>
          `,
          true,
          true,
        ),
      )
    })
  })

  describe('Readonly array modifier', () => {
    test('readonly string array', () => {
      const sourceFile = createSourceFile(project, 'type Test = readonly string[]')

      expect(generateFormattedCode(sourceFile)).toBe(
        formatWithPrettier(
          `
            export const Test = Type.Readonly(Type.Array(Type.String()))

            export type Test = Static<typeof Test>
          `,
        ),
      )
    })

    test('readonly custom type array', () => {
      const sourceFile = createSourceFile(
        project,
        `
          type CustomType = { id: string }
          type Test = readonly CustomType[]
        `,
      )

      expect(generateFormattedCode(sourceFile)).toBe(
        formatWithPrettier(
          `
            export const CustomType = Type.Object({
              id: Type.String()
            })

            export type CustomType = Static<typeof CustomType>

            export const Test = Type.Readonly(Type.Array(CustomType))

            export type Test = Static<typeof Test>
          `,
        ),
      )
    })

    test('readonly tuple', () => {
      const sourceFile = createSourceFile(project, 'type Test = readonly [string, number]')

      expect(generateFormattedCode(sourceFile)).toBe(
        formatWithPrettier(
          `
            export const Test = Type.Readonly(Type.Tuple([Type.String(), Type.Number()]))

            export type Test = Static<typeof Test>
          `,
        ),
      )
    })
  })

  describe('Mixed readonly scenarios', () => {
    test('readonly array inside readonly utility type', () => {
      const sourceFile = createSourceFile(
        project,
        'type Test = Readonly<{ items: readonly string[] }>',
      )

      expect(generateFormattedCode(sourceFile)).toBe(
        formatWithPrettier(
          `
            export const Test = Type.Readonly(Type.Object({
              items: Type.Readonly(Type.Array(Type.String()))
            }))

            export type Test = Static<typeof Test>
          `,
        ),
      )
    })

    test('readonly utility type with array', () => {
      const sourceFile = createSourceFile(project, 'type Test = Readonly<string[]>')

      expect(generateFormattedCode(sourceFile)).toBe(
        formatWithPrettier(
          `
            export const Test = Type.Readonly(Type.Array(Type.String()))

            export type Test = Static<typeof Test>
          `,
        ),
      )
    })
  })
})
