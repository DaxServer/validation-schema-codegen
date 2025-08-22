import { createSourceFile, formatWithPrettier, generateFormattedCode } from '@test-fixtures/utils'
import { beforeEach, describe, expect, test } from 'bun:test'
import { Project } from 'ts-morph'

describe('Template literals', () => {
  let project: Project

  beforeEach(() => {
    project = new Project()
  })

  test('one string', () => {
    const sourceFile = createSourceFile(project, "type T = `${'A'}`;")

    expect(generateFormattedCode(sourceFile)).resolves.toBe(
      formatWithPrettier(`
        const T = Type.TemplateLiteral([Type.Literal('A')]);

        type T = Static<typeof T>;
      `),
    )
  })

  test('multiple strings', () => {
    const sourceFile = createSourceFile(project, "type T = `${'A'|'B'}`;")

    expect(generateFormattedCode(sourceFile)).resolves.toBe(
      formatWithPrettier(`
        const T = Type.TemplateLiteral([
          Type.Union([Type.Literal('A'), Type.Literal('B')])
        ]);

        type T = Static<typeof T>;
      `),
    )
  })

  test('concatenated with literal at start', () => {
    const sourceFile = createSourceFile(project, "type T = `${'A'|'B'}prop`;")

    expect(generateFormattedCode(sourceFile)).resolves.toBe(
      formatWithPrettier(`
        const T = Type.TemplateLiteral([
          Type.Union([Type.Literal('A'), Type.Literal('B')]),
          Type.Literal('prop'),
        ]);

        type T = Static<typeof T>;
      `),
    )
  })

  test('concatenated with literal at end', () => {
    const sourceFile = createSourceFile(project, "type T = `prop${'A'|'B'}`;")

    expect(generateFormattedCode(sourceFile)).resolves.toBe(
      formatWithPrettier(`
        const T = Type.TemplateLiteral([
          Type.Literal('prop'),
          Type.Union([Type.Literal('A'), Type.Literal('B')]),
        ]);

        type T = Static<typeof T>;
      `),
    )
  })

  test('concatenated with numeric type', () => {
    const sourceFile = createSourceFile(project, 'type T = `prop${number}`;')

    expect(generateFormattedCode(sourceFile)).resolves.toBe(
      formatWithPrettier(`
        const T = Type.TemplateLiteral([Type.Literal('prop'), Type.Number()]);

        type T = Static<typeof T>;
      `),
    )
  })

  test('concatenation before and after', () => {
    const sourceFile = createSourceFile(project, 'type A = `prefix-${string}-suffix`')

    expect(generateFormattedCode(sourceFile)).resolves.toBe(
      formatWithPrettier(`
        const A = Type.TemplateLiteral([
          Type.Literal("prefix-"),
          Type.String(),
          Type.Literal("-suffix"),
        ]);

        type A = Static<typeof A>;
      `),
    )
  })
})
