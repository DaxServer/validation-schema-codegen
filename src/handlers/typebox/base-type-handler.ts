import type { TypeBoxContext } from '@daxserver/validation-schema-codegen/utils/typebox-call'
import { Node, ts } from 'ts-morph'

export abstract class BaseTypeHandler {
  abstract canHandle(node: Node): boolean
  abstract handle(node: Node, context: TypeBoxContext): ts.Expression
}
