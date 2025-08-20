import { Node, ts } from 'ts-morph'
import { makeTypeCall } from './typebox-codegen-utils'
import { TypeBoxTypeHandlers } from '../handlers/typebox/typebox-type-handlers'

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
