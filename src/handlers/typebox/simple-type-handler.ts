import { Node, SyntaxKind, ts } from 'ts-morph'
import { makeTypeCall } from '../../utils/typebox-codegen-utils'
import { BaseTypeHandler } from './base-type-handler'

export const TypeBoxType = 'Type'

type SimpleKinds =
  | SyntaxKind.AnyKeyword
  | SyntaxKind.BooleanKeyword
  | SyntaxKind.NeverKeyword
  | SyntaxKind.NullKeyword
  | SyntaxKind.NumberKeyword
  | SyntaxKind.StringKeyword
  | SyntaxKind.UnknownKeyword
  | SyntaxKind.VoidKeyword

const kindToTypeBox: Record<SimpleKinds, string> = {
  [SyntaxKind.AnyKeyword]: 'Any',
  [SyntaxKind.BooleanKeyword]: 'Boolean',
  [SyntaxKind.NeverKeyword]: 'Never',
  [SyntaxKind.NullKeyword]: 'Null',
  [SyntaxKind.NumberKeyword]: 'Number',
  [SyntaxKind.StringKeyword]: 'String',
  [SyntaxKind.UnknownKeyword]: 'Unknown',
  [SyntaxKind.VoidKeyword]: 'Void',
}

export class SimpleTypeHandler extends BaseTypeHandler {
  constructor() {
    super(() => ts.factory.createIdentifier('')) // getTypeBoxType is not used in SimpleTypeHandler
  }

  canHandle(typeNode?: Node): boolean {
    const kind = typeNode?.getKind()
    return kind !== undefined && kind in kindToTypeBox
  }

  handle(typeNode: Node): ts.Expression {
    const kind = typeNode?.getKind() ?? SyntaxKind.AnyKeyword
    return makeTypeCall(kindToTypeBox[kind as SimpleKinds])
  }
}
