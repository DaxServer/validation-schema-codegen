import { ts } from 'ts-morph'

export const makeTypeCall = (method: string, args: ts.Expression[] = []) => {
  return ts.factory.createCallExpression(
    ts.factory.createPropertyAccessExpression(
      ts.factory.createIdentifier('Type'),
      ts.factory.createIdentifier(method),
    ),
    undefined,
    args,
  )
}
