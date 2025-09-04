import { CollectionBaseHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/collection/collection-base-handler'
import { GenericTypeUtils } from '@daxserver/validation-schema-codegen/utils/generic-type-utils'
import type { TypeBoxContext } from '@daxserver/validation-schema-codegen/utils/typebox-call'
import { getTypeBoxType } from '@daxserver/validation-schema-codegen/utils/typebox-call'
import { ArrayTypeNode, Node, ts } from 'ts-morph'

export class ArrayTypeHandler extends CollectionBaseHandler {
  canHandle(node: Node): boolean {
    return Node.isArrayTypeNode(node)
  }

  handle(node: ArrayTypeNode, context: TypeBoxContext): ts.Expression {
    const typeboxType = getTypeBoxType(node.getElementTypeNode(), context)

    return GenericTypeUtils.makeTypeCall('Array', [typeboxType])
  }
}
