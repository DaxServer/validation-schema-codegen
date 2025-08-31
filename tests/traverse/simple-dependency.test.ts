import { DependencyTraversal } from '@daxserver/validation-schema-codegen/traverse/dependency-traversal'
import { createSourceFile } from '@test-fixtures/utils'
import { describe, expect, test } from 'bun:test'
import { Project } from 'ts-morph'

describe('Simple dependency ordering', () => {
  test('should order simple dependencies correctly', () => {
    const project = new Project()

    const sourceFile = createSourceFile(
      project,
      `
        export type UserId = string
        export type User = {
          id: UserId
          name: string
        }
        export type Users = Record<UserId, User>
      `,
    )

    const traversal = new DependencyTraversal()
    const result = traversal.startTraversal(sourceFile)

    // UserId should come before User
    const userIdIndex = result.findIndex((node) => node.originalName === 'UserId')
    const userIndex = result.findIndex((node) => node.originalName === 'User')
    const usersIndex = result.findIndex((node) => node.originalName === 'Users')

    expect(userIdIndex).toBeGreaterThanOrEqual(0)
    expect(userIndex).toBeGreaterThanOrEqual(0)
    expect(usersIndex).toBeGreaterThanOrEqual(0)

    // Check correct ordering
    expect(userIdIndex).toBeLessThan(userIndex)
    expect(userIndex).toBeLessThan(usersIndex)
    expect(userIdIndex).toBeLessThan(usersIndex)
  })
})
