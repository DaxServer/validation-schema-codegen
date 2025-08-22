import { BaseTypeHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/base-type-handler'
import { getTypeBoxType } from '@daxserver/validation-schema-codegen/utils/typebox-call'
import { makeTypeCall } from '@daxserver/validation-schema-codegen/utils/typebox-codegen-utils'
import { FunctionTypeNode, Node, ts } from 'ts-morph'

export class FunctionTypeHandler extends BaseTypeHandler {
  canHandle(node: Node): boolean {
    return Node.isFunctionTypeNode(node)
  }

  handle(node: FunctionTypeNode): ts.Expression {
    const parameters = node.getParameters()
    const returnType = node.getReturnTypeNode()

    // Convert parameters to TypeBox types
    const parameterTypes = parameters.map((param) => {
      const paramTypeNode = param.getTypeNode()
      const paramType = getTypeBoxType(paramTypeNode)

      // Check if parameter is optional
      if (param.hasQuestionToken()) {
        return makeTypeCall('Optional', [paramType])
      }

      return paramType
    })

    // Convert return type to TypeBox type
    const returnTypeBox = getTypeBoxType(returnType)

    // Create TypeBox Function call with parameters array and return type
    return makeTypeCall('Function', [
      ts.factory.createArrayLiteralExpression(parameterTypes),
      returnTypeBox,
    ])
  }
}
