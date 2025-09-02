import { CollectionBaseHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/collection/collection-base-handler'
import type { TypeBoxContext } from '@daxserver/validation-schema-codegen/utils/typebox-call'
import { Node, ts, UnionTypeNode } from 'ts-morph'

export class UnionTypeHandler extends CollectionBaseHandler {
  canHandle(node: Node): boolean {
    return Node.isUnionTypeNode(node)
  }

  handle(node: UnionTypeNode, context: TypeBoxContext): ts.Expression {
    const types = node.getTypeNodes()
    return this.processTypeCollection(types, 'Union', context)
  }
}
