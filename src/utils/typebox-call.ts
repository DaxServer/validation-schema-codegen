import { TypeBoxTypeHandlers } from '@daxserver/validation-schema-codegen/handlers/typebox/typebox-type-handlers'
import { makeTypeCall } from '@daxserver/validation-schema-codegen/utils/typebox-codegen-utils'
import { Node, ts } from 'ts-morph'

export const TypeBoxStatic = 'Static'

let handlers: TypeBoxTypeHandlers | null = null

export const getTypeBoxType = (node?: Node): ts.Expression => {
  if (!node) {
    return makeTypeCall('Any')
  }

  if (!handlers) {
    handlers = new TypeBoxTypeHandlers()
  }

  const handler = handlers.getHandler(node)

  return handler ? handler.handle(node) : makeTypeCall('Any')
}
