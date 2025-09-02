import { TypeReferenceBaseHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/reference/type-reference-base-handler'
import { GenericTypeUtils } from '@daxserver/validation-schema-codegen/utils/generic-type-utils'
import { resolverStore } from '@daxserver/validation-schema-codegen/utils/resolver-store'
import type { TypeBoxContext } from '@daxserver/validation-schema-codegen/utils/typebox-call'
import { getTypeBoxType } from '@daxserver/validation-schema-codegen/utils/typebox-call'
import { Node, ts, TypeReferenceNode } from 'ts-morph'

export class RecordTypeHandler extends TypeReferenceBaseHandler {
  protected readonly supportedTypeNames = ['Record']
  protected readonly expectedArgumentCount = 2

  handle(node: TypeReferenceNode, context: TypeBoxContext): ts.Expression {
    const typeRef = this.validateTypeReference(node)
    const [keyType, valueType] = this.extractTypeArguments(typeRef)

    // Check if keyType is a type reference that might be chunked
    if (Node.isTypeReference(keyType)) {
      const typeName = keyType.getTypeName()
      if (Node.isIdentifier(typeName)) {
        const originalTypeName = typeName.getText()
        const qualifiedName = resolverStore.resolveQualifiedName(originalTypeName)

        // Check if the node exists in the graph before accessing it
        if (qualifiedName && context.nodeGraph.hasNode(qualifiedName)) {
          const referencedNode = context.nodeGraph.getNode(qualifiedName)

          // Check if this is a chunked union type
          if (
            referencedNode &&
            referencedNode.chunkReferences &&
            referencedNode.chunkReferences.length > 0
          ) {
            // Generate Type.Intersect of Type.Record for each chunk
            const chunkRecords = referencedNode.chunkReferences.map(
              (chunkQualifiedName: string) => {
                const chunkNode = context.nodeGraph.getNode(chunkQualifiedName)
                const chunkOriginalName = chunkNode?.originalName || chunkQualifiedName
                const chunkIdentifier = ts.factory.createIdentifier(chunkOriginalName)
                const typeBoxValueType = getTypeBoxType(valueType, context)
                return GenericTypeUtils.makeTypeCall('Record', [chunkIdentifier, typeBoxValueType])
              },
            )

            return GenericTypeUtils.makeTypeCall('Intersect', [
              ts.factory.createArrayLiteralExpression(chunkRecords),
            ])
          }
        }
      }
    }

    const typeBoxKeyType = getTypeBoxType(keyType, context)
    const typeBoxValueType = getTypeBoxType(valueType, context)

    return GenericTypeUtils.makeTypeCall('Record', [typeBoxKeyType, typeBoxValueType])
  }
}
