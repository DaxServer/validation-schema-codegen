import { Project } from 'ts-morph'
import { generateCode } from '../../../src/ts-morph-codegen'

// Read the Wikibase SDK entity type definitions
const project = new Project()

// Read the Wikibase SDK entity type definitions
const sourceFile = project.createSourceFile('wikibase.ts', 'import { Entity } from "wikibase-sdk"')

// Generate TypeBox code
const typeboxCode = await generateCode(sourceFile, {
  exportEverything: true,
  tsConfig: new URL('tsconfig.json', import.meta.url),
})

// Write the generated code to the output file
const outputPath = `${__dirname}/output.ts`
await Bun.write(outputPath, typeboxCode)
console.log(`TypeBox schemas generated at ${outputPath}`)
