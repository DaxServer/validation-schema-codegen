import { BaseTypeHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/base-type-handler'
import { makeTypeCall } from '@daxserver/validation-schema-codegen/utils/typebox-codegen-utils'
import { Node, ts } from 'ts-morph'

export class TemplateLiteralTypeHandler extends BaseTypeHandler {
  constructor(getTypeBoxType: (typeNode?: Node) => ts.Expression) {
    super(getTypeBoxType)
  }

  canHandle(typeNode?: Node): boolean {
    return Node.isTemplateLiteralTypeNode(typeNode)
  }

  handle(typeNode: Node): ts.Expression {
    if (!Node.isTemplateLiteralTypeNode(typeNode)) {
      return makeTypeCall('Any')
    }

    // For template literal types, we'll convert them to string patterns
    // This is a simplified approach - TypeBox supports template literals with T.TemplateLiteral
    const templateText = typeNode.getText()

    // For simple cases like `Q${number}`, we can represent as a string pattern
    // In a more complete implementation, we might parse the template parts
    return makeTypeCall('TemplateLiteral', [ts.factory.createStringLiteral(templateText)])
  }
}
