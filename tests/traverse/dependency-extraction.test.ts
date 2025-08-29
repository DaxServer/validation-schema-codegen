import { DependencyTraversal } from '@daxserver/validation-schema-codegen/traverse/dependency-traversal'
import type { TraversedNode } from '@daxserver/validation-schema-codegen/traverse/types'
import { createSourceFile } from '@test-fixtures/utils'
import { beforeEach, describe, expect, test } from 'bun:test'
import { Project } from 'ts-morph'

const getNodeName = (traversedNode: TraversedNode): string => {
  return traversedNode.originalName
}

describe('Dependency Extraction', () => {
  let project: Project
  let traverser: DependencyTraversal

  beforeEach(() => {
    project = new Project()
    traverser = new DependencyTraversal()
  })

  test('should extract dependencies from enums', () => {
    createSourceFile(
      project,
      `
        export type Status = 'active' | 'inactive';
      `,
      'status.ts',
    )

    const mainFile = createSourceFile(
      project,
      `
        import { Status } from "./status";

        enum UserStatus {
          ACTIVE = 'active',
          INACTIVE = 'inactive'
        }

        type UserWithStatus = {
          id: string;
          status: Status;
        };
      `,
      'main.ts',
    )

    traverser.startTraversal(mainFile)
    const dependencies = traverser.getNodesToPrint()

    // Should have Status, UserStatus, and UserWithStatus
    expect(dependencies).toHaveLength(3)

    const typeNames = dependencies.map((d) => getNodeName(d))
    expect(typeNames).toContain('Status')
    expect(typeNames).toContain('UserStatus')
    expect(typeNames).toContain('UserWithStatus')

    // Status should come before UserWithStatus in topological order
    const statusIndex = dependencies.findIndex((d) => getNodeName(d) === 'Status')
    const userWithStatusIndex = dependencies.findIndex((d) => getNodeName(d) === 'UserWithStatus')
    expect(statusIndex).toBeLessThan(userWithStatusIndex)
  })

  test('should extract dependencies from functions', () => {
    createSourceFile(
      project,
      `
        export type User = {
          id: string;
          name: string;
        };
      `,
      'user.ts',
    )

    const mainFile = createSourceFile(
      project,
      `
        import { User } from "./user";

        function createUser(name: string): User {
          return { id: '1', name };
        }

        type UserFactory = {
          create: typeof createUser;
        };
      `,
      'main.ts',
    )

    traverser.startTraversal(mainFile)
    const dependencies = traverser.getNodesToPrint()

    // Should have User, createUser, and UserFactory
    expect(dependencies).toHaveLength(3)

    const typeNames = dependencies.map((d) => getNodeName(d))
    expect(typeNames).toContain('User')
    expect(typeNames).toContain('createUser')
    expect(typeNames).toContain('UserFactory')

    // User should come before createUser in topological order
    const userIndex = dependencies.findIndex((d) => getNodeName(d) === 'User')
    const createUserIndex = dependencies.findIndex((d) => getNodeName(d) === 'createUser')
    const userFactoryIndex = dependencies.findIndex((d) => getNodeName(d) === 'UserFactory')

    expect(userIndex).toBeLessThan(createUserIndex)
    expect(createUserIndex).toBeLessThan(userFactoryIndex)
  })

  test('should extract dependencies from enum with type references', () => {
    createSourceFile(
      project,
      `
        export type Color = 'red' | 'green' | 'blue';
      `,
      'color.ts',
    )

    const mainFile = createSourceFile(
      project,
      `
        import { Color } from "./color";

        enum Theme {
          LIGHT = 'light',
          DARK = 'dark'
        }

        type ThemedColor = {
          color: Color;
          theme: Theme;
        };
      `,
      'main.ts',
    )

    traverser.startTraversal(mainFile)
    const dependencies = traverser.getNodesToPrint()

    // Should have Color, Theme, and ThemedColor
    expect(dependencies).toHaveLength(3)

    const typeNames = dependencies.map((d) => getNodeName(d))
    expect(typeNames).toContain('Color')
    expect(typeNames).toContain('Theme')
    expect(typeNames).toContain('ThemedColor')

    // Both Color and Theme should come before ThemedColor
    const colorIndex = dependencies.findIndex((d) => getNodeName(d) === 'Color')
    const themeIndex = dependencies.findIndex((d) => getNodeName(d) === 'Theme')
    const themedColorIndex = dependencies.findIndex((d) => getNodeName(d) === 'ThemedColor')

    expect(colorIndex).toBeLessThan(themedColorIndex)
    expect(themeIndex).toBeLessThan(themedColorIndex)
  })
})
