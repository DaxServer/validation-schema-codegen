import { ObjectLikeBaseHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/object/object-like-base-handler'
import type { TypeBoxContext } from '@daxserver/validation-schema-codegen/utils/typebox-call'
import { Node, ts, TypeLiteralNode } from 'ts-morph'

export class ObjectTypeHandler extends ObjectLikeBaseHandler {
  canHandle(node: Node): boolean {
    return Node.isTypeLiteral(node)
  }

  handle(node: TypeLiteralNode, context: TypeBoxContext): ts.Expression {
    const properties = node.getProperties()
    return this.createObjectType(this.processProperties(properties, context))
  }
}
