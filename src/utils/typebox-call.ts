import { TypeBoxTypeHandlers } from '@daxserver/validation-schema-codegen/handlers/typebox/typebox-type-handlers'
import { makeTypeCall } from '@daxserver/validation-schema-codegen/utils/typebox-codegen-utils'
import { Node, ts } from 'ts-morph'

export const TypeBoxStatic = 'Static'

let handlers: TypeBoxTypeHandlers | null = null

export const getTypeBoxType = (typeNode?: Node): ts.Expression => {
  if (!handlers) {
    handlers = new TypeBoxTypeHandlers(getTypeBoxType)
  }
  const handler = handlers.getHandler(typeNode)
  if (handler) {
    return handler.handle(typeNode)
  }
  return makeTypeCall('Any')
}
