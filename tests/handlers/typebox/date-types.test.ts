import { createSourceFile, formatWithPrettier, generateFormattedCode } from '@test-fixtures/utils'
import { beforeEach, describe, expect, test } from 'bun:test'
import { Project } from 'ts-morph'

describe('Date types', () => {
  let project: Project

  beforeEach(() => {
    project = new Project()
  })

  test('without export', () => {
    const sourceFile = createSourceFile(project, `type A = Date`)

    expect(generateFormattedCode(sourceFile)).toBe(
      formatWithPrettier(`
        export const A = Type.Date();

        export type A = Static<typeof A>;
      `),
    )
  })

  test('with export', () => {
    const sourceFile = createSourceFile(project, `export type A = Date`)

    expect(generateFormattedCode(sourceFile)).toBe(
      formatWithPrettier(`
        export const A = Type.Date();

        export type A = Static<typeof A>;
      `),
    )
  })

  test('simple Date type alias', () => {
    const sourceFile = createSourceFile(project, `type Timestamp = Date`)

    expect(generateFormattedCode(sourceFile)).toBe(
      formatWithPrettier(`
        export const Timestamp = Type.Date();

        export type Timestamp = Static<typeof Timestamp>;
      `),
    )
  })

  test('Date in object property', () => {
    const sourceFile = createSourceFile(
      project,
      `
      interface User {
        name: string;
        createdAt: Date;
      }
    `,
    )

    expect(generateFormattedCode(sourceFile)).toBe(
      formatWithPrettier(`
        export const User = Type.Object({
          name: Type.String(),
          createdAt: Type.Date(),
        });

        export type User = Static<typeof User>;
      `),
    )
  })

  test('Date in union type', () => {
    const sourceFile = createSourceFile(project, `type Value = string | Date | number`)

    expect(generateFormattedCode(sourceFile)).toBe(
      formatWithPrettier(`
        export const Value = Type.Union([Type.String(), Type.Date(), Type.Number()]);

        export type Value = Static<typeof Value>;
      `),
    )
  })

  test('Date in array', () => {
    const sourceFile = createSourceFile(project, `type Dates = Date[]`)

    expect(generateFormattedCode(sourceFile)).toBe(
      formatWithPrettier(`
        export const Dates = Type.Array(Type.Date());

        export type Dates = Static<typeof Dates>;
      `),
    )
  })

  test('Date in function parameter and return type', () => {
    const sourceFile = createSourceFile(
      project,
      `
      function formatDate(date: Date): string {
        return date.toString();
      }
    `,
    )

    expect(generateFormattedCode(sourceFile)).toBe(
      formatWithPrettier(`
        export const formatDate = Type.Function([Type.Date()], Type.String());

        export type formatDate = Static<typeof formatDate>;
      `),
    )
  })
})
