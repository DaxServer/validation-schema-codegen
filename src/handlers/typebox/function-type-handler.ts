import { BaseTypeHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/base-type-handler'
import { GenericTypeUtils } from '@daxserver/validation-schema-codegen/utils/generic-type-utils'
import type { TypeBoxContext } from '@daxserver/validation-schema-codegen/utils/typebox-call'
import { getTypeBoxType } from '@daxserver/validation-schema-codegen/utils/typebox-call'
import { FunctionTypeNode, Node, ts } from 'ts-morph'

export class FunctionTypeHandler extends BaseTypeHandler {
  canHandle(node: Node): boolean {
    return Node.isFunctionTypeNode(node)
  }

  handle(node: FunctionTypeNode, context: TypeBoxContext): ts.Expression {
    const parameters = node.getParameters()
    const returnType = node.getReturnTypeNode()

    // Convert parameters to TypeBox types
    const parameterTypes = parameters.map((param) => {
      const paramTypeNode = param.getTypeNode()
      const paramType = getTypeBoxType(paramTypeNode, context)

      // Check if parameter is optional
      if (param.hasQuestionToken()) {
        return GenericTypeUtils.makeTypeCall('Optional', [paramType])
      }

      return paramType
    })

    // Convert return type to TypeBox type
    const returnTypeBox = getTypeBoxType(returnType, context)

    // Create TypeBox Function call with parameters array and return type
    return GenericTypeUtils.makeTypeCall('Function', [
      ts.factory.createArrayLiteralExpression(parameterTypes),
      returnTypeBox,
    ])
  }
}
