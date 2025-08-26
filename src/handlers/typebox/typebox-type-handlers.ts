import { BaseTypeHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/base-type-handler'
import { ArrayTypeHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/collection/array-type-handler'
import { IntersectionTypeHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/collection/intersection-type-handler'
import { TupleTypeHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/collection/tuple-type-handler'
import { UnionTypeHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/collection/union-type-handler'
import { FunctionTypeHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/function-type-handler'
import { IndexedAccessTypeHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/indexed-access-type-handler'
import { KeyOfTypeHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/keyof-type-handler'
import { LiteralTypeHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/literal-type-handler'
import { InterfaceTypeHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/object/interface-type-handler'
import { ObjectTypeHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/object/object-type-handler'
import { ReadonlyTypeHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/readonly-type-handler'
import { OmitTypeHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/reference/omit-type-handler'
import { PartialTypeHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/reference/partial-type-handler'
import { PickTypeHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/reference/pick-type-handler'
import { RecordTypeHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/reference/record-type-handler'
import { RequiredTypeHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/reference/required-type-handler'
import { SimpleTypeHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/simple-type-handler'
import { TemplateLiteralTypeHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/template-literal-type-handler'
import { TypeQueryHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/type-query-handler'
import { TypeReferenceHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/type-reference-handler'
import { TypeofTypeHandler } from '@daxserver/validation-schema-codegen/handlers/typebox/typeof-type-handler'
import { Node, SyntaxKind } from 'ts-morph'

export class TypeBoxTypeHandlers {
  private syntaxKindHandlers = new Map<SyntaxKind, BaseTypeHandler>()
  private typeReferenceHandlers = new Map<string, BaseTypeHandler>()
  private fallbackHandlers: BaseTypeHandler[]
  private handlerCache = new Map<string, BaseTypeHandler>()

  constructor() {
    const simpleTypeHandler = new SimpleTypeHandler()
    const literalTypeHandler = new LiteralTypeHandler()
    const objectTypeHandler = new ObjectTypeHandler()
    const arrayTypeHandler = new ArrayTypeHandler()
    const tupleTypeHandler = new TupleTypeHandler()
    const unionTypeHandler = new UnionTypeHandler()
    const intersectionTypeHandler = new IntersectionTypeHandler()
    const recordTypeHandler = new RecordTypeHandler()
    const partialTypeHandler = new PartialTypeHandler()
    const pickTypeHandler = new PickTypeHandler()
    const omitTypeHandler = new OmitTypeHandler()
    const requiredTypeHandler = new RequiredTypeHandler()
    const typeReferenceHandler = new TypeReferenceHandler()
    const keyOfTypeHandler = new KeyOfTypeHandler()
    const indexedAccessTypeHandler = new IndexedAccessTypeHandler()
    const interfaceTypeHandler = new InterfaceTypeHandler()
    const functionTypeHandler = new FunctionTypeHandler()
    const typeQueryHandler = new TypeQueryHandler()
    const templateLiteralTypeHandler = new TemplateLiteralTypeHandler()
    const typeofTypeHandler = new TypeofTypeHandler()
    const readonlyTypeHandler = new ReadonlyTypeHandler()

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
    this.fallbackHandlers = [
      typeReferenceHandler,
      keyOfTypeHandler,
      typeofTypeHandler,
      readonlyTypeHandler,
    ]
  }

  public getHandler(node: Node): BaseTypeHandler {
    const nodeKind = node.getKind()

    // Use stable cache key based on node text and kind
    const nodeText = node.getText()
    const cacheKey = `${nodeKind}-${nodeText}`

    const cachedHandler = this.handlerCache.get(cacheKey)
    if (cachedHandler) {
      return cachedHandler
    }

    let handler: BaseTypeHandler | undefined

    // O(1) lookup by syntax kind (most common case)
    handler = this.syntaxKindHandlers.get(nodeKind)

    // O(1) lookup for type references by name
    if (!handler && nodeKind === SyntaxKind.TypeReference && Node.isTypeReference(node)) {
      const typeNameNode = node.getTypeName()

      if (Node.isIdentifier(typeNameNode)) {
        const typeNameText = typeNameNode.getText()
        handler = this.typeReferenceHandlers.get(typeNameText)
      }
    }

    // If no handler found yet, check fallback handlers
    if (!handler) {
      for (const fallbackHandler of this.fallbackHandlers) {
        if (fallbackHandler.canHandle(node)) {
          handler = fallbackHandler
          break
        }
      }
    }

    if (handler) {
      this.handlerCache.set(cacheKey, handler)
    } else {
      throw new Error(`No handler found for type: ${node.getText()}`)
    }

    return handler
  }
}
