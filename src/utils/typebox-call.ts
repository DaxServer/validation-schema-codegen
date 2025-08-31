import { TypeBoxTypeHandlers } from '@daxserver/validation-schema-codegen/handlers/typebox/typebox-type-handlers'
import { makeTypeCall } from '@daxserver/validation-schema-codegen/utils/typebox-codegen-utils'
import { Node, ts } from 'ts-morph'

let handlers: TypeBoxTypeHandlers | null = null

export const getTypeBoxType = (node?: Node): ts.Expression => {
  if (!node) return makeTypeCall('Any')

  if (!handlers) {
    handlers = new TypeBoxTypeHandlers()
  }

  return handlers.getHandler(node).handle(node)
}
