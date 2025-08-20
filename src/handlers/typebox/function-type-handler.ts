import { Node, ts } from 'ts-morph'
import { makeTypeCall } from '../../utils/typebox-codegen-utils'
import { BaseTypeHandler } from './base-type-handler'

export class FunctionTypeHandler extends BaseTypeHandler {
  constructor(getTypeBoxType: (typeNode?: Node) => ts.Expression) {
    super(getTypeBoxType)
  }

  canHandle(typeNode?: Node): boolean {
    return Node.isFunctionTypeNode(typeNode)
  }

  handle(typeNode: Node): ts.Expression {
    if (!Node.isFunctionTypeNode(typeNode)) {
      return makeTypeCall('Any')
    }

    const parameters = typeNode.getParameters()
    const returnType = typeNode.getReturnTypeNode()

    // Convert parameters to TypeBox types
    const parameterTypes = parameters.map((param) => {
      const paramTypeNode = param.getTypeNode()
      const paramType = this.getTypeBoxType(paramTypeNode)

      // Check if parameter is optional
      if (param.hasQuestionToken()) {
        return makeTypeCall('Optional', [paramType])
      }

      return paramType
    })

    // Convert return type to TypeBox type
    const returnTypeBox = this.getTypeBoxType(returnType)

    // Create TypeBox Function call with parameters array and return type
    return makeTypeCall('Function', [
      ts.factory.createArrayLiteralExpression(parameterTypes),
      returnTypeBox,
    ])
  }
}
