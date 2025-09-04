import { TypeBoxTypeHandlers } from '@daxserver/validation-schema-codegen/handlers/typebox/typebox-type-handlers'
import { NodeGraph } from '@daxserver/validation-schema-codegen/traverse/node-graph'
import { GenericTypeUtils } from '@daxserver/validation-schema-codegen/utils/generic-type-utils'
import { Node, ts } from 'ts-morph'

let handlers: TypeBoxTypeHandlers | null = null

export interface TypeBoxContext {
  nodeGraph: NodeGraph
}

export const getTypeBoxType = (node?: Node, context?: TypeBoxContext): ts.Expression => {
  if (!node || !context) return GenericTypeUtils.makeTypeCall('Any')

  if (!handlers) {
    handlers = new TypeBoxTypeHandlers()
  }

  return handlers.getHandler(node).handle(node, context)
}
