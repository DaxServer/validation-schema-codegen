import { BaseTypeHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/base-type-handler'
import { GenericTypeUtils } from '@daxserver/validation-schema-codegen/utils/generic-type-utils'
import { isAnySyntaxKind } from '@daxserver/validation-schema-codegen/utils/node-type-utils'
import { Node, SyntaxKind, ts } from 'ts-morph'

export const TypeBoxType = 'Type'

const SimpleKinds = [
  SyntaxKind.AnyKeyword,
  SyntaxKind.BooleanKeyword,
  SyntaxKind.NeverKeyword,
  SyntaxKind.NullKeyword,
  SyntaxKind.NumberKeyword,
  SyntaxKind.StringKeyword,
  SyntaxKind.UnknownKeyword,
  SyntaxKind.VoidKeyword,
] as const
type SimpleKind = (typeof SimpleKinds)[number]

const kindToTypeBox: Record<SimpleKind, string> = {
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
    return isAnySyntaxKind(node, SimpleKinds)
  }

  handle(node: Node): ts.Expression {
    return GenericTypeUtils.makeTypeCall(kindToTypeBox[node.getKind() as SimpleKind])
  }
}
