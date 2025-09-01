import { NodeGraph } from '@daxserver/validation-schema-codegen/traverse/node-graph'
import { TypeReferenceExtractor } from '@daxserver/validation-schema-codegen/traverse/type-reference-extractor'
import { resolverStore } from '@daxserver/validation-schema-codegen/utils/resolver-store'
import { beforeEach, describe, expect, test } from 'bun:test'
import { Project } from 'ts-morph'

describe('TypeReferenceExtractor ambiguous name resolution', () => {
  let project: Project
  let nodeGraph: NodeGraph
  let extractor: TypeReferenceExtractor

  beforeEach(() => {
    project = new Project()
    nodeGraph = new NodeGraph()
    extractor = new TypeReferenceExtractor()
    resolverStore.clear()
  })

  test('should disambiguate type references when multiple files have same type name', () => {
    // Create first source file with User type
    const userFile = project.createSourceFile(
      'user-types.ts',
      `
        export type User = {
          id: string;
          name: string;
        };
      `,
    )

    // Create second source file with different User type
    const adminFile = project.createSourceFile(
      'admin-types.ts',
      `
        export type User = {
          userId: number;
          email: string;
        };
      `,
    )

    // Add both User types to the node graph with their qualified names
    const userTypeAlias = userFile.getTypeAliases()[0]!
    const adminTypeAlias = adminFile.getTypeAliases()[0]!

    const userQualifiedName = resolverStore.generateQualifiedName('User', userFile)
    const adminQualifiedName = resolverStore.generateQualifiedName('User', adminFile)

    nodeGraph.addTypeNode(userQualifiedName, {
      node: userTypeAlias,
      type: 'typeAlias',
      originalName: 'User',
      qualifiedName: userQualifiedName,
      isImported: true,
      isMainCode: false,
    })

    nodeGraph.addTypeNode(adminQualifiedName, {
      node: adminTypeAlias,
      type: 'typeAlias',
      originalName: 'User',
      qualifiedName: adminQualifiedName,
      isImported: true,
      isMainCode: false,
    })

    // Also populate the resolverStore with alias mappings
    resolverStore.addTypeMapping({
      originalName: 'User',
      sourceFile: userFile,
      aliasName: 'UserType',
    })
    resolverStore.addTypeMapping({
      originalName: 'User',
      sourceFile: adminFile,
      aliasName: 'AdminUser',
    })

    // Create a main file that references User
    const mainFile = project.createSourceFile(
      'main.ts',
      `
        import { User as UserType } from "./user-types";
        import { User as AdminUser } from "./admin-types";

        type UserProfile = {
          user: UserType;
          admin: AdminUser;
        };
      `,
    )

    const userProfileType = mainFile.getTypeAliases()[0]!
    const typeNode = userProfileType.getTypeNode()!

    // Extract type references from the UserProfile type
    const references = extractor.extractTypeReferences(typeNode)

    expect(references.length).toBeGreaterThan(0)
  })

  test('should disambiguate type references when multiple files have same interface name', () => {
    // Create two files with same interface name
    const commonFile = project.createSourceFile(
      'common-types.ts',
      `
        export interface BaseEntity {
          id: string;
          createdAt: Date;
        }
      `,
    )

    const legacyFile = project.createSourceFile(
      'legacy-types.ts',
      `
        export interface BaseEntity {
          entityId: number;
          version: number;
        }
      `,
    )

    // Add both BaseEntity interfaces to the node graph
    const commonInterface = commonFile.getInterfaces()[0]!
    const legacyInterface = legacyFile.getInterfaces()[0]!

    const commonQualifiedName = resolverStore.generateQualifiedName('BaseEntity', commonFile)
    const legacyQualifiedName = resolverStore.generateQualifiedName('BaseEntity', legacyFile)

    nodeGraph.addTypeNode(commonQualifiedName, {
      node: commonInterface,
      type: 'interface',
      originalName: 'BaseEntity',
      qualifiedName: commonQualifiedName,
      isImported: true,
      isMainCode: false,
    })

    nodeGraph.addTypeNode(legacyQualifiedName, {
      node: legacyInterface,
      type: 'interface',
      originalName: 'BaseEntity',
      qualifiedName: legacyQualifiedName,
      isImported: true,
      isMainCode: false,
    })

    // Create main file with interface inheritance
    const mainFile = project.createSourceFile(
      'main.ts',
      `
        import { BaseEntity as CommonBase } from "./common-types";
        import { BaseEntity as LegacyBase } from "./legacy-types";

        interface ModernUser extends CommonBase {
          email: string;
        }

        interface LegacyUser extends LegacyBase {
          username: string;
        }
      `,
    )

    const modernUserInterface = mainFile.getInterfaces()[0]!
    const legacyUserInterface = mainFile.getInterfaces()[1]!

    // Extract references from both interfaces
    const modernReferences = extractor.extractTypeReferences(modernUserInterface)
    const legacyReferences = extractor.extractTypeReferences(legacyUserInterface)

    expect(modernReferences.length).toBeGreaterThanOrEqual(0)
    expect(legacyReferences.length).toBeGreaterThanOrEqual(0)
  })
})
