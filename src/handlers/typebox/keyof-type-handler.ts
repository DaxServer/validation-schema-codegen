import { TypeOperatorBaseHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/type-operator-base-handler'
import { makeTypeCall } from '@daxserver/validation-schema-codegen/utils/typebox-codegen-utils'
import { SyntaxKind, ts } from 'ts-morph'

export class KeyOfTypeHandler extends TypeOperatorBaseHandler {
  protected readonly operatorKind = SyntaxKind.KeyOfKeyword
  protected readonly typeBoxMethod = 'KeyOf'

  protected createTypeBoxCall(innerType: ts.Expression): ts.Expression {
    return makeTypeCall('KeyOf', [innerType])
  }
}
