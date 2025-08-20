import { beforeEach, describe, expect, test } from 'bun:test'
import { Project } from 'ts-morph'
import { createSourceFile, formatWithPrettier } from './utils'
import { generateCode } from '../../src/ts-morph-codegen'

describe('Advanced types', () => {
  let project: Project

  beforeEach(() => {
    project = new Project()
  })

  describe('Template literal types', () => {
    test('simple template literal', () => {
      const sourceFile = createSourceFile(project, 'type A = `Q${number}`')

      expect(formatWithPrettier(generateCode(sourceFile), false)).toBe(
        formatWithPrettier(`
      const A = Type.TemplateLiteral("\`Q\${number}\`");

      type A = Static<typeof A>;
    `),
      )
    })

    test('complex template literal', () => {
      const sourceFile = createSourceFile(project, 'type A = `prefix-${string}-suffix`')

      expect(formatWithPrettier(generateCode(sourceFile), false)).toBe(
        formatWithPrettier(`
      const A = Type.TemplateLiteral("\`prefix-\${string}-suffix\`");

      type A = Static<typeof A>;
    `),
      )
    })
  })

  describe('Typeof expressions', () => {
    test('typeof variable', () => {
      const sourceFile = createSourceFile(
        project,
        `
        const myVar = { x: 1, y: 'hello' }
        type A = typeof myVar
      `,
      )

      expect(formatWithPrettier(generateCode(sourceFile), false)).toBe(
        formatWithPrettier(`
      const A = myVar;

      type A = Static<typeof A>;
    `),
      )
    })

    test('typeof with qualified name', () => {
      const sourceFile = createSourceFile(
        project,
        `
        namespace MyNamespace {
          export const config = { port: 3000 }
        }
        type A = typeof MyNamespace.config
      `,
      )

      expect(formatWithPrettier(generateCode(sourceFile), false)).toBe(
        formatWithPrettier(`
      const A = MyNamespace_config;

      type A = Static<typeof A>;
    `),
      )
    })
  })
})
