import { DependencyTraversal } from '@daxserver/validation-schema-codegen/traverse/dependency-traversal'
import type { TraversedNode } from '@daxserver/validation-schema-codegen/traverse/types'
import { createSourceFile } from '@test-fixtures/utils'
import { beforeEach, describe, expect, test } from 'bun:test'
import { Project } from 'ts-morph'

const getNodeName = (traversedNode: TraversedNode): string => {
  return traversedNode.originalName
}

describe('Interface Inheritance Dependencies', () => {
  let project: Project
  let traverser: DependencyTraversal

  beforeEach(() => {
    project = new Project()
    traverser = new DependencyTraversal()
  })

  test('should extract dependencies from interface inheritance', () => {
    const sourceFile = createSourceFile(
      project,
      `
        interface SimplifySnakOptions {
          entityPrefix?: string
        }

        type SimplifySnaksOptions = SimplifySnakOptions

        interface SimplifyClaimsOptions extends SimplifySnaksOptions {
          keepQualifiers?: boolean
        }
      `,
    )

    const dependencies = traverser.startTraversal(sourceFile)

    // Should have all three types
    expect(dependencies).toHaveLength(3)

    const typeNames = dependencies.map((d) => getNodeName(d))
    expect(typeNames).toContain('SimplifySnakOptions')
    expect(typeNames).toContain('SimplifySnaksOptions')
    expect(typeNames).toContain('SimplifyClaimsOptions')

    // SimplifySnakOptions should come before SimplifySnaksOptions
    const snakOptionsIndex = dependencies.findIndex((d) => getNodeName(d) === 'SimplifySnakOptions')
    const snaksOptionsIndex = dependencies.findIndex(
      (d) => getNodeName(d) === 'SimplifySnaksOptions',
    )
    expect(snakOptionsIndex).toBeLessThan(snaksOptionsIndex)

    // SimplifySnaksOptions should come before SimplifyClaimsOptions
    const claimsOptionsIndex = dependencies.findIndex(
      (d) => getNodeName(d) === 'SimplifyClaimsOptions',
    )
    expect(snaksOptionsIndex).toBeLessThan(claimsOptionsIndex)
  })

  test('should handle multiple interface inheritance', () => {
    const sourceFile = createSourceFile(
      project,
      `
        interface A { a: string }
        interface B { b: number }
        interface C extends A, B { c: boolean }
      `,
    )

    const dependencies = traverser.startTraversal(sourceFile)

    expect(dependencies).toHaveLength(3)

    const typeNames = dependencies.map((d) => getNodeName(d))
    expect(typeNames).toContain('A')
    expect(typeNames).toContain('B')
    expect(typeNames).toContain('C')

    // Both A and B should come before C
    const aIndex = dependencies.findIndex((d) => getNodeName(d) === 'A')
    const bIndex = dependencies.findIndex((d) => getNodeName(d) === 'B')
    const cIndex = dependencies.findIndex((d) => getNodeName(d) === 'C')

    expect(aIndex).toBeLessThan(cIndex)
    expect(bIndex).toBeLessThan(cIndex)
  })

  test('should handle nested interface inheritance', () => {
    const sourceFile = createSourceFile(
      project,
      `
        interface A { a: string }
        interface B extends A { b: number }
        interface C extends B { c: boolean }
      `,
    )

    const dependencies = traverser.startTraversal(sourceFile)

    expect(dependencies).toHaveLength(3)

    const typeNames = dependencies.map((d) => getNodeName(d))
    expect(typeNames).toContain('A')
    expect(typeNames).toContain('B')
    expect(typeNames).toContain('C')

    // Should be in order: A, B, C
    const aIndex = dependencies.findIndex((d) => getNodeName(d) === 'A')
    const bIndex = dependencies.findIndex((d) => getNodeName(d) === 'B')
    const cIndex = dependencies.findIndex((d) => getNodeName(d) === 'C')

    expect(aIndex).toBeLessThan(bIndex)
    expect(bIndex).toBeLessThan(cIndex)
  })
})
