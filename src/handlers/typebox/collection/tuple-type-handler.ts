import { CollectionBaseHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/collection/collection-base-handler'
import { Node, ts, TupleTypeNode } from 'ts-morph'

export class TupleTypeHandler extends CollectionBaseHandler {
  canHandle(node: Node): boolean {
    return Node.isTupleTypeNode(node)
  }

  handle(node: TupleTypeNode): ts.Expression {
    return this.processTypeCollection(node.getElements(), 'Tuple')
  }
}
