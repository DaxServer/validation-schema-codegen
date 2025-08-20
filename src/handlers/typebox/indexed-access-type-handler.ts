import { ts, Node, IndexedAccessTypeNode } from 'ts-morph'
import { BaseTypeHandler } from './base-type-handler'
import { makeTypeCall } from '../../utils/typebox-codegen-utils'

export class IndexedAccessTypeHandler extends BaseTypeHandler {
  canHandle(node: Node | undefined): boolean {
    return node !== undefined && node.isKind(ts.SyntaxKind.IndexedAccessType)
  }

  handle(node: Node): ts.Expression {
    const typeNode = node as IndexedAccessTypeNode
    const objectType = typeNode.getObjectTypeNode()
    const indexType = typeNode.getIndexTypeNode()

    const typeboxObjectType = this.getTypeBoxType(objectType)
    const typeboxIndexType = this.getTypeBoxType(indexType)

    return makeTypeCall('Index', [typeboxObjectType, typeboxIndexType])
  }
}
