import { TypeOperatorBaseHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/type/type-operator-base-handler'
import { SyntaxKind } from 'ts-morph'

export class KeyOfTypeHandler extends TypeOperatorBaseHandler {
  protected readonly operatorKind = SyntaxKind.KeyOfKeyword
  protected readonly typeBoxMethod = 'KeyOf'
}
