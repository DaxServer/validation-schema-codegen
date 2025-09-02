import { BaseTypeHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/base-type-handler'
import { TemplateLiteralTypeProcessor } from '@daxserver/validation-schema-codegen/handlers/typebox/template-literal-type-processor'
import { GenericTypeUtils } from '@daxserver/validation-schema-codegen/utils/generic-type-utils'
import { Node, TemplateLiteralTypeNode, ts } from 'ts-morph'

export class TemplateLiteralTypeHandler extends BaseTypeHandler {
  canHandle(node: Node): boolean {
    return Node.isTemplateLiteralTypeNode(node)
  }

  handle(node: TemplateLiteralTypeNode): ts.Expression {
    const parts: ts.Expression[] = []

    // Add the head part (literal string before first substitution)
    const head = node.getHead()
    const headCompilerNode = head.compilerNode as ts.TemplateHead
    const headText = headCompilerNode.text
    if (headText) {
      parts.push(
        GenericTypeUtils.makeTypeCall('Literal', [ts.factory.createStringLiteral(headText)]),
      )
    }

    // Process template spans (substitutions + following literal parts)
    const templateSpans = node.getTemplateSpans()
    for (const span of templateSpans) {
      // Access the compiler node to get type and literal
      const compilerNode = span.compilerNode as ts.TemplateLiteralTypeSpan

      // Add the type from the substitution
      const processedType = TemplateLiteralTypeProcessor.processType(compilerNode.type)
      parts.push(processedType)

      // Add the literal part after the substitution
      const literalText = compilerNode.literal.text
      if (literalText) {
        parts.push(
          GenericTypeUtils.makeTypeCall('Literal', [ts.factory.createStringLiteral(literalText)]),
        )
      }
    }

    // If no parts were found, fallback to a simple string
    if (parts.length === 0) {
      return GenericTypeUtils.makeTypeCall('String')
    }

    // Return TemplateLiteral with array of parts
    return GenericTypeUtils.makeTypeCall('TemplateLiteral', [
      ts.factory.createArrayLiteralExpression(parts),
    ])
  }
}
