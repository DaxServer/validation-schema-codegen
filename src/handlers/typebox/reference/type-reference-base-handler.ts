import { BaseTypeHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/base-type-handler'
import { Node, SyntaxKind, TypeNode, TypeReferenceNode } from 'ts-morph'

export abstract class TypeReferenceBaseHandler extends BaseTypeHandler {
  protected abstract readonly supportedTypeNames: string[]
  protected abstract readonly expectedArgumentCount: number

  canHandle(node: Node): boolean {
    if (node.getKind() !== SyntaxKind.TypeReference) return false

    const typeRef = node as TypeReferenceNode
    const typeName = typeRef.getTypeName().getText()

    return this.supportedTypeNames.includes(typeName)
  }

  protected validateTypeReference(node: Node): TypeReferenceNode {
    if (node.getKind() !== SyntaxKind.TypeReference) {
      throw new Error(`Expected TypeReference node, got ${node.getKind()}`)
    }

    return node as TypeReferenceNode
  }

  protected extractTypeArguments(node: TypeReferenceNode): TypeNode[] {
    const typeArgs = node.getTypeArguments()

    if (typeArgs.length !== this.expectedArgumentCount) {
      throw new Error(
        `Expected ${this.expectedArgumentCount} type argument(s), got ${typeArgs.length}`,
      )
    }

    return typeArgs
  }

  protected getTypeName(node: TypeReferenceNode): string {
    return node.getTypeName().getText()
  }
}
