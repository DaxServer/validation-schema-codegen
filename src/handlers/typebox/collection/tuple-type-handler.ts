import { CollectionBaseHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/collection/collection-base-handler'
import type { TypeBoxContext } from '@daxserver/validation-schema-codegen/utils/typebox-call'
import { Node, ts, TupleTypeNode } from 'ts-morph'

export class TupleTypeHandler extends CollectionBaseHandler {
  canHandle(node: Node): boolean {
    return Node.isTupleTypeNode(node)
  }

  handle(node: TupleTypeNode, context: TypeBoxContext): ts.Expression {
    const elements = node.getElements()
    return this.processTypeCollection(elements, 'Tuple', context)
  }
}
