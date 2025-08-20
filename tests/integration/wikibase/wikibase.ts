import { Project } from 'ts-morph'
import { generateCode } from '../../../src/ts-morph-codegen'

// Read the Wikibase SDK entity type definitions
const project = new Project()

// Add tsconfig.json to the in-memory file system
const tsConfigPath = 'tsconfig.json'
const tsConfigContent = await Bun.file(tsConfigPath).text()
project.createSourceFile(tsConfigPath, tsConfigContent, { overwrite: true })

// Read the Wikibase SDK entity type definitions
const sourceFile = project.createSourceFile('wikibase.ts', 'import { Entity } from "wikibase-sdk"')

// Generate TypeBox code
const typeboxCode = generateCode(sourceFile, { exportEverything: true })

// Write the generated code to the output file
const outputPath = `${__dirname}/output.ts`
await Bun.write(outputPath, typeboxCode)
console.log(`TypeBox schemas generated at ${outputPath}`)
