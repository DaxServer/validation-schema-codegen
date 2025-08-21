import { BaseTypeHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/base-type-handler'
import { makeTypeCall } from '@daxserver/validation-schema-codegen/utils/typebox-codegen-utils'
import { Node, ts } from 'ts-morph'

export class TupleTypeHandler extends BaseTypeHandler {
  constructor(getTypeBoxType: (typeNode?: Node) => ts.Expression) {
    super(getTypeBoxType)
  }

  canHandle(typeNode?: Node): boolean {
    return Node.isTupleTypeNode(typeNode)
  }

  handle(typeNode: Node): ts.Expression {
    if (!Node.isTupleTypeNode(typeNode)) {
      return makeTypeCall('Any')
    }
    const tupleTypes = typeNode.getElements().map(this.getTypeBoxType)
    return makeTypeCall('Tuple', [ts.factory.createArrayLiteralExpression(tupleTypes)])
  }
}
