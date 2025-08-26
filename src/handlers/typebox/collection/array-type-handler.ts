import { CollectionBaseHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/collection/collection-base-handler'
import { ArrayTypeNode, Node, ts } from 'ts-morph'

export class ArrayTypeHandler extends CollectionBaseHandler {
  canHandle(node: Node): boolean {
    return Node.isArrayTypeNode(node)
  }

  handle(node: ArrayTypeNode): ts.Expression {
    return this.processSingleType(node.getElementTypeNode(), 'Array')
  }
}
