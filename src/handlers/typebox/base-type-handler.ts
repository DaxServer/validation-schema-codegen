import { Node, ts } from 'ts-morph'

export abstract class BaseTypeHandler {
  protected getTypeBoxType: (typeNode?: Node) => ts.Expression

  constructor(getTypeBoxType: (typeNode?: Node) => ts.Expression) {
    this.getTypeBoxType = getTypeBoxType
  }

  abstract canHandle(typeNode: Node | undefined): boolean
  abstract handle(typeNode: Node | undefined): ts.Expression
}
