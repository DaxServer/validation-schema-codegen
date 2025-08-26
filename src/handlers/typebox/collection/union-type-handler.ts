import { CollectionBaseHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/collection/collection-base-handler'
import { Node, ts, UnionTypeNode } from 'ts-morph'

export class UnionTypeHandler extends CollectionBaseHandler {
  canHandle(node: Node): boolean {
    return Node.isUnionTypeNode(node)
  }

  handle(node: UnionTypeNode): ts.Expression {
    return this.processTypeCollection(node.getTypeNodes(), 'Union')
  }
}
