import { CollectionBaseHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/collection/collection-base-handler'
import { IntersectionTypeNode, Node, ts } from 'ts-morph'

export class IntersectionTypeHandler extends CollectionBaseHandler {
  canHandle(node: Node): boolean {
    return Node.isIntersectionTypeNode(node)
  }

  handle(node: IntersectionTypeNode): ts.Expression {
    return this.processTypeCollection(node.getTypeNodes(), 'Intersect')
  }
}
