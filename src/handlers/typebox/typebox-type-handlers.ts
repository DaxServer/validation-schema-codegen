import { ArrayTypeHandler } from 'src/handlers/typebox/array-type-handler'
import { BaseTypeHandler } from 'src/handlers/typebox/base-type-handler'
import { FunctionTypeHandler } from 'src/handlers/typebox/function-type-handler'
import { IndexedAccessTypeHandler } from 'src/handlers/typebox/indexed-access-type-handler'
import { InterfaceTypeHandler } from 'src/handlers/typebox/interface-type-handler'
import { IntersectionTypeHandler } from 'src/handlers/typebox/intersection-type-handler'
import { LiteralTypeHandler } from 'src/handlers/typebox/literal-type-handler'
import { ObjectTypeHandler } from 'src/handlers/typebox/object-type-handler'
import { OmitTypeHandler } from 'src/handlers/typebox/omit-type-handler'
import { PartialTypeHandler } from 'src/handlers/typebox/partial-type-handler'
import { PickTypeHandler } from 'src/handlers/typebox/pick-type-handler'
import { RecordTypeHandler } from 'src/handlers/typebox/record-type-handler'
import { RequiredTypeHandler } from 'src/handlers/typebox/required-type-handler'
import { SimpleTypeHandler } from 'src/handlers/typebox/simple-type-handler'
import { TemplateLiteralTypeHandler } from 'src/handlers/typebox/template-literal-type-handler'
import { TupleTypeHandler } from 'src/handlers/typebox/tuple-type-handler'
import { TypeOperatorHandler } from 'src/handlers/typebox/type-operator-handler'
import { TypeQueryHandler } from 'src/handlers/typebox/type-query-handler'
import { TypeReferenceHandler } from 'src/handlers/typebox/type-reference-handler'
import { UnionTypeHandler } from 'src/handlers/typebox/union-type-handler'
import { Node, SyntaxKind, ts } from 'ts-morph'

export class TypeBoxTypeHandlers {
  private syntaxKindHandlers = new Map<SyntaxKind, BaseTypeHandler>()
  private typeReferenceHandlers = new Map<string, BaseTypeHandler>()
  private fallbackHandlers: BaseTypeHandler[]
  private handlerCache = new Map<string, BaseTypeHandler>()

  constructor(getTypeBoxType: (typeNode?: Node) => ts.Expression) {
    const simpleTypeHandler = new SimpleTypeHandler()
    const literalTypeHandler = new LiteralTypeHandler()
    const objectTypeHandler = new ObjectTypeHandler(getTypeBoxType)
    const arrayTypeHandler = new ArrayTypeHandler(getTypeBoxType)
    const tupleTypeHandler = new TupleTypeHandler(getTypeBoxType)
    const unionTypeHandler = new UnionTypeHandler(getTypeBoxType)
    const intersectionTypeHandler = new IntersectionTypeHandler(getTypeBoxType)
    const recordTypeHandler = new RecordTypeHandler(getTypeBoxType)
    const partialTypeHandler = new PartialTypeHandler(getTypeBoxType)
    const pickTypeHandler = new PickTypeHandler(getTypeBoxType)
    const omitTypeHandler = new OmitTypeHandler(getTypeBoxType)
    const requiredTypeHandler = new RequiredTypeHandler(getTypeBoxType)
    const typeReferenceHandler = new TypeReferenceHandler(getTypeBoxType)
    const typeOperatorHandler = new TypeOperatorHandler(getTypeBoxType)
    const indexedAccessTypeHandler = new IndexedAccessTypeHandler(getTypeBoxType)
    const interfaceTypeHandler = new InterfaceTypeHandler(getTypeBoxType)
    const functionTypeHandler = new FunctionTypeHandler(getTypeBoxType)
    const typeQueryHandler = new TypeQueryHandler(getTypeBoxType)
    const templateLiteralTypeHandler = new TemplateLiteralTypeHandler(getTypeBoxType)

    // O(1) lookup by SyntaxKind
    this.syntaxKindHandlers.set(SyntaxKind.AnyKeyword, simpleTypeHandler)
    this.syntaxKindHandlers.set(SyntaxKind.BooleanKeyword, simpleTypeHandler)
    this.syntaxKindHandlers.set(SyntaxKind.NeverKeyword, simpleTypeHandler)
    this.syntaxKindHandlers.set(SyntaxKind.NullKeyword, simpleTypeHandler)
    this.syntaxKindHandlers.set(SyntaxKind.NumberKeyword, simpleTypeHandler)
    this.syntaxKindHandlers.set(SyntaxKind.StringKeyword, simpleTypeHandler)
    this.syntaxKindHandlers.set(SyntaxKind.UnknownKeyword, simpleTypeHandler)
    this.syntaxKindHandlers.set(SyntaxKind.VoidKeyword, simpleTypeHandler)
    this.syntaxKindHandlers.set(SyntaxKind.LiteralType, literalTypeHandler)
    this.syntaxKindHandlers.set(SyntaxKind.TrueKeyword, literalTypeHandler)
    this.syntaxKindHandlers.set(SyntaxKind.FalseKeyword, literalTypeHandler)
    this.syntaxKindHandlers.set(SyntaxKind.TypeLiteral, objectTypeHandler)
    this.syntaxKindHandlers.set(SyntaxKind.ArrayType, arrayTypeHandler)
    this.syntaxKindHandlers.set(SyntaxKind.TupleType, tupleTypeHandler)
    this.syntaxKindHandlers.set(SyntaxKind.UnionType, unionTypeHandler)
    this.syntaxKindHandlers.set(SyntaxKind.IntersectionType, intersectionTypeHandler)
    this.syntaxKindHandlers.set(SyntaxKind.TypeOperator, typeOperatorHandler)
    this.syntaxKindHandlers.set(SyntaxKind.IndexedAccessType, indexedAccessTypeHandler)
    this.syntaxKindHandlers.set(SyntaxKind.InterfaceDeclaration, interfaceTypeHandler)
    this.syntaxKindHandlers.set(SyntaxKind.FunctionType, functionTypeHandler)
    this.syntaxKindHandlers.set(SyntaxKind.TypeQuery, typeQueryHandler)
    this.syntaxKindHandlers.set(SyntaxKind.TemplateLiteralType, templateLiteralTypeHandler)

    // O(1) lookup by type reference name
    this.typeReferenceHandlers.set('Record', recordTypeHandler)
    this.typeReferenceHandlers.set('Partial', partialTypeHandler)
    this.typeReferenceHandlers.set('Pick', pickTypeHandler)
    this.typeReferenceHandlers.set('Omit', omitTypeHandler)
    this.typeReferenceHandlers.set('Required', requiredTypeHandler)

    // Fallback handlers for complex cases
    this.fallbackHandlers = [typeReferenceHandler]
  }

  public getHandler(typeNode?: Node): BaseTypeHandler | undefined {
    if (!typeNode) return undefined

    const nodeKind = typeNode.getKind()

    // Use stable cache key based on node text and kind
    const nodeText = typeNode.getText()
    const cacheKey = `${nodeKind}-${nodeText}`

    const cachedHandler = this.handlerCache.get(cacheKey)
    if (cachedHandler) {
      return cachedHandler
    }

    let handler: BaseTypeHandler | undefined

    // O(1) lookup by syntax kind (most common case)
    handler = this.syntaxKindHandlers.get(nodeKind)

    // O(1) lookup for type references by name
    if (!handler && nodeKind === SyntaxKind.TypeReference && Node.isTypeReference(typeNode)) {
      const typeNameNode = typeNode.getTypeName()

      if (Node.isIdentifier(typeNameNode)) {
        const typeNameText = typeNameNode.getText()
        handler = this.typeReferenceHandlers.get(typeNameText)
      }

      // If no specific utility type handler found, use TypeReferenceHandler as default
      if (!handler) {
        handler = this.fallbackHandlers[0] // TypeReferenceHandler
      }
    }

    if (handler) {
      this.handlerCache.set(cacheKey, handler)
    } else {
      throw new Error(`No handler found for type: ${typeNode.getText()}`)
    }

    return handler
  }
}
