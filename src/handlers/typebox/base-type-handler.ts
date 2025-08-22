import { Node, ts } from 'ts-morph'

export abstract class BaseTypeHandler {
  abstract canHandle(node: Node): boolean
  abstract handle(node: Node): ts.Expression
}
