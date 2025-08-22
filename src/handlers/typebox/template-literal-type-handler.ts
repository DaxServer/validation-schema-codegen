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

    const parts: ts.Expression[] = []
    
    // Add the head part (literal string before first substitution)
    const head = typeNode.getHead()
    const headCompilerNode = head.compilerNode as ts.TemplateHead
    const headText = headCompilerNode.text
    if (headText) {
      parts.push(makeTypeCall('Literal', [ts.factory.createStringLiteral(headText)]))
    }
    
    // Process template spans (substitutions + following literal parts)
    const templateSpans = typeNode.getTemplateSpans()
    for (const span of templateSpans) {
      // Access the compiler node to get type and literal
      const compilerNode = span.compilerNode as ts.TemplateLiteralTypeSpan
      
      // Add the type from the substitution
      if (compilerNode.type) {
        // Handle common type cases directly
        const typeKind = compilerNode.type.kind
        if (typeKind === ts.SyntaxKind.StringKeyword) {
          parts.push(makeTypeCall('String'))
        } else if (typeKind === ts.SyntaxKind.NumberKeyword) {
          parts.push(makeTypeCall('Number'))
        } else if (typeKind === ts.SyntaxKind.LiteralType) {
          // Handle literal types (e.g., 'A', 42, true)
          const literalType = compilerNode.type as ts.LiteralTypeNode
          if (ts.isStringLiteral(literalType.literal)) {
            parts.push(makeTypeCall('Literal', [ts.factory.createStringLiteral(literalType.literal.text)]))
          } else if (ts.isNumericLiteral(literalType.literal)) {
            parts.push(makeTypeCall('Literal', [ts.factory.createNumericLiteral(literalType.literal.text)]))
          } else {
            parts.push(makeTypeCall('String')) // fallback for other literals
          }
        } else if (typeKind === ts.SyntaxKind.UnionType) {
          // For union types, we need to handle each type in the union
          const unionType = compilerNode.type as ts.UnionTypeNode
          const unionParts = unionType.types.map(t => {
            if (t.kind === ts.SyntaxKind.LiteralType) {
              const literalType = t as ts.LiteralTypeNode
              if (ts.isStringLiteral(literalType.literal)) {
                return makeTypeCall('Literal', [ts.factory.createStringLiteral(literalType.literal.text)])
              }
            }
            return makeTypeCall('String') // fallback
          })
          parts.push(makeTypeCall('Union', [ts.factory.createArrayLiteralExpression(unionParts)]))
        } else {
          // Fallback for other types
          parts.push(makeTypeCall('String'))
        }
      }
      
      // Add the literal part after the substitution
      const literalText = compilerNode.literal?.text
      if (literalText) {
        parts.push(makeTypeCall('Literal', [ts.factory.createStringLiteral(literalText)]))
      }
    }
    
    // If no parts were found, fallback to a simple string
    if (parts.length === 0) {
      return makeTypeCall('String')
    }
    
    // Return TemplateLiteral with array of parts
    return makeTypeCall('TemplateLiteral', [ts.factory.createArrayLiteralExpression(parts)])
  }
}
