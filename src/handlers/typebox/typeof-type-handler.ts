import { BaseTypeHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/base-type-handler'
import { makeTypeCall } from '@daxserver/validation-schema-codegen/utils/typebox-codegen-utils'
import { Node, ts } from 'ts-morph'

export class TypeofTypeHandler extends BaseTypeHandler {
  canHandle(node: Node): boolean {
    return Node.isTypeQuery(node)
  }

  handle(): ts.Expression {
    // TypeQuery represents 'typeof' expressions in TypeScript
    // For TypeBox, we'll return a String type as typeof returns string literals
    return makeTypeCall('String')
  }
}
