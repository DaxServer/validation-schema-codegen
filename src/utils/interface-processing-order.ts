import { ts, type InterfaceDeclaration } from 'ts-morph'

export const getInterfaceProcessingOrder = (
  interfaces: InterfaceDeclaration[],
): InterfaceDeclaration[] => {
  const interfaceMap = new Map<string, InterfaceDeclaration>()
  const visited = new Set<string>()
  const visiting = new Set<string>()
  const processingOrder: InterfaceDeclaration[] = []

  // Build interface map
  interfaces.forEach((iface) => {
    interfaceMap.set(iface.getName(), iface)
  })

  const visit = (interfaceName: string): void => {
    if (visited.has(interfaceName) || visiting.has(interfaceName)) {
      return
    }

    const iface = interfaceMap.get(interfaceName)
    if (!iface) {
      return
    }

    visiting.add(interfaceName)

    // Process heritage clauses (extends)
    const heritageClauses = iface.getHeritageClauses()
    heritageClauses.forEach((heritageClause) => {
      if (heritageClause.getToken() !== ts.SyntaxKind.ExtendsKeyword) {
        return
      }

      heritageClause.getTypeNodes().forEach((typeNode) => {
        const baseInterfaceName = typeNode.getText()
        if (interfaceMap.has(baseInterfaceName)) {
          visit(baseInterfaceName)
        }
      })
    })

    visiting.delete(interfaceName)
    visited.add(interfaceName)
    processingOrder.push(iface)
  }

  // Visit all interfaces
  interfaces.forEach((iface) => {
    visit(iface.getName())
  })

  return processingOrder
}
