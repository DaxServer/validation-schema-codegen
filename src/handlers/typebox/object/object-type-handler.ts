import { ObjectLikeBaseHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/object/object-like-base-handler'
import { Node, ts, TypeLiteralNode } from 'ts-morph'

export class ObjectTypeHandler extends ObjectLikeBaseHandler {
  canHandle(node: Node): boolean {
    return Node.isTypeLiteral(node)
  }

  handle(node: TypeLiteralNode): ts.Expression {
    return this.createObjectType(this.processProperties(node.getProperties()))
  }
}
