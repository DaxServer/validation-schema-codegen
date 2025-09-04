import { BaseParser } from '@daxserver/validation-schema-codegen/parsers/base-parser'
import { GenericTypeUtils } from '@daxserver/validation-schema-codegen/utils/generic-type-utils'
import { getTypeBoxType } from '@daxserver/validation-schema-codegen/utils/typebox-call'
import { FunctionDeclaration, ts, VariableDeclarationKind } from 'ts-morph'

export class FunctionDeclarationParser extends BaseParser {
  parse(functionDecl: FunctionDeclaration, aliasName?: string): void {
    const originalFunctionName = functionDecl.getName()
    if (!originalFunctionName) return

    const functionName = aliasName || originalFunctionName

    if (this.processedTypes.has(functionName)) return
    this.processedTypes.add(functionName)

    // Get function parameters and return type
    const parameters = functionDecl.getParameters()
    const returnType = functionDecl.getReturnTypeNode()

    // Convert parameters to TypeBox types
    const parameterTypes = parameters.map((param) => {
      const paramTypeNode = param.getTypeNode()
      const paramType = paramTypeNode
        ? getTypeBoxType(paramTypeNode, { nodeGraph: this.nodeGraph })
        : GenericTypeUtils.makeTypeCall('Any')

      // Check if parameter is optional or required
      if (!param.hasQuestionToken()) {
        return paramType
      }

      // Parameter is optional
      return ts.factory.createCallExpression(
        ts.factory.createPropertyAccessExpression(
          ts.factory.createIdentifier('Type'),
          ts.factory.createIdentifier('Optional'),
        ),
        undefined,
        [paramType],
      )
    })

    // Convert return type to TypeBox type
    const returnTypeBox = returnType
      ? getTypeBoxType(returnType, { nodeGraph: this.nodeGraph })
      : GenericTypeUtils.makeTypeCall('Any')

    // Create TypeBox Function call with parameters array and return type
    const typeboxExpression = ts.factory.createCallExpression(
      ts.factory.createPropertyAccessExpression(
        ts.factory.createIdentifier('Type'),
        ts.factory.createIdentifier('Function'),
      ),
      undefined,
      [ts.factory.createArrayLiteralExpression(parameterTypes), returnTypeBox],
    )

    const typeboxType = this.printer.printNode(
      ts.EmitHint.Expression,
      typeboxExpression,
      this.newSourceFile.compilerNode,
    )

    this.newSourceFile.addVariableStatement({
      isExported: true,
      declarationKind: VariableDeclarationKind.Const,
      declarations: [
        {
          name: functionName,
          initializer: typeboxType,
        },
      ],
    })

    GenericTypeUtils.addStaticTypeAlias(
      this.newSourceFile,
      functionName,
      this.newSourceFile.compilerNode,
      this.printer,
    )
  }
}
