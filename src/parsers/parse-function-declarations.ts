import { ts, FunctionDeclaration, VariableDeclarationKind } from 'ts-morph'
import { addStaticTypeAlias } from '../utils/add-static-type-alias'
import { getTypeBoxType } from '../utils/typebox-call'
import { BaseParser } from './base-parser'

export class FunctionDeclarationParser extends BaseParser {
  parse(functionDecl: FunctionDeclaration): void {
    this.parseWithImportFlag(functionDecl, false)
  }

  parseWithImportFlag(functionDecl: FunctionDeclaration, isImported: boolean): void {
    this.parseFunctionWithImportFlag(functionDecl, isImported)
  }

  private parseFunctionWithImportFlag(
    functionDecl: FunctionDeclaration,
    isImported: boolean,
  ): void {
    const functionName = functionDecl.getName()
    if (!functionName) {
      return
    }

    if (this.processedTypes.has(functionName)) {
      return
    }
    this.processedTypes.add(functionName)

    // Get function parameters and return type
    const parameters = functionDecl.getParameters()
    const returnType = functionDecl.getReturnTypeNode()

    // Convert parameters to TypeBox types
    const parameterTypes = parameters.map((param) => {
      const paramTypeNode = param.getTypeNode()
      const paramType = getTypeBoxType(paramTypeNode)

      // Check if parameter is optional
      if (param.hasQuestionToken()) {
        return ts.factory.createCallExpression(
          ts.factory.createPropertyAccessExpression(
            ts.factory.createIdentifier('Type'),
            ts.factory.createIdentifier('Optional'),
          ),
          undefined,
          [paramType],
        )
      }

      return paramType
    })

    // Convert return type to TypeBox type
    const returnTypeBox = getTypeBoxType(returnType)

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

    const isExported = this.getIsExported(functionDecl, isImported)

    this.newSourceFile.addVariableStatement({
      isExported,
      declarationKind: VariableDeclarationKind.Const,
      declarations: [
        {
          name: functionName,
          initializer: typeboxType,
        },
      ],
    })

    addStaticTypeAlias(
      this.newSourceFile,
      functionName,
      this.newSourceFile.compilerNode,
      this.printer,
      isExported,
    )
  }
}
