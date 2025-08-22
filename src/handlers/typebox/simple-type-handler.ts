import { BaseTypeHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/base-type-handler'
import { makeTypeCall } from '@daxserver/validation-schema-codegen/utils/typebox-codegen-utils'
import { Node, SyntaxKind, ts } from 'ts-morph'

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
  canHandle(node: Node): boolean {
    return node.getKind() in kindToTypeBox
  }

  handle(node: Node): ts.Expression {
    return makeTypeCall(kindToTypeBox[node.getKind() as SimpleKinds])
  }
}
