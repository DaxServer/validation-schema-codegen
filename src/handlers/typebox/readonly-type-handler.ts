import { TypeOperatorBaseHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/type-operator-base-handler'
import { makeTypeCall } from '@daxserver/validation-schema-codegen/utils/typebox-codegen-utils'
import { SyntaxKind, ts } from 'ts-morph'

export class ReadonlyTypeHandler extends TypeOperatorBaseHandler {
  protected readonly operatorKind = SyntaxKind.ReadonlyKeyword
  protected readonly typeBoxMethod = 'Readonly'

  protected createTypeBoxCall(innerType: ts.Expression): ts.Expression {
    return makeTypeCall('Readonly', [innerType])
  }
}
