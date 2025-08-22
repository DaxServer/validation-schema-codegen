import { ObjectLikeBaseHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/object/object-like-base-handler'
import { InterfaceDeclaration, Node, ts } from 'ts-morph'

export class InterfaceTypeHandler extends ObjectLikeBaseHandler {
  canHandle(node: Node): boolean {
    return Node.isInterfaceDeclaration(node)
  }

  handle(node: InterfaceDeclaration): ts.Expression {
    return this.createObjectType(this.processProperties(node.getProperties()))
  }
}
