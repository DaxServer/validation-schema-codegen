import { TypeOperatorBaseHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/type/type-operator-base-handler'
import { SyntaxKind } from 'ts-morph'

export class ReadonlyArrayTypeHandler extends TypeOperatorBaseHandler {
  protected readonly operatorKind = SyntaxKind.ReadonlyKeyword
  protected readonly typeBoxMethod = 'Readonly'
}
