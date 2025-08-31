import { CollectionBaseHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/collection/collection-base-handler'
import { getTypeBoxType } from '@daxserver/validation-schema-codegen/utils/typebox-call'
import { makeTypeCall } from '@daxserver/validation-schema-codegen/utils/typebox-codegen-utils'
import { ArrayTypeNode, Node, ts } from 'ts-morph'

export class ArrayTypeHandler extends CollectionBaseHandler {
  canHandle(node: Node): boolean {
    return Node.isArrayTypeNode(node)
  }

  handle(node: ArrayTypeNode): ts.Expression {
    const typeboxType = getTypeBoxType(node.getElementTypeNode())

    return makeTypeCall('Array', [typeboxType])
  }
}
