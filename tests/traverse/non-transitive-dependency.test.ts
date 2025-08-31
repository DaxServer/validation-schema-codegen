import { createSourceFile, formatWithPrettier, generateFormattedCode } from '@test-fixtures/utils'
import { beforeEach, describe, expect, test } from 'bun:test'
import { Project } from 'ts-morph'

describe('Non-transitive dependency filtering', () => {
  let project: Project

  beforeEach(() => {
    project = new Project()
  })

  test('should not include unreferenced types from imported files', () => {
    createSourceFile(
      project,
      `
        type ApiQueryValue = string | number | true
        export type ApiQueryParameters = Record<string, ApiQueryValue>
        export type Url = string
        export type BuildUrlFunction = <T extends string>(options: Readonly<Partial<Record<T, ApiQueryValue>>>) => Url
        export declare function buildUrlFactory(instanceApiEndpoint: Url): BuildUrlFunction
      `,
      'build_url.d.ts',
    )

    createSourceFile(
      project,
      `
        import type { Url } from './build_url'

        export interface Sitelink {
          site: string
          title: string
          url?: Url
        }
      `,
      'sitelinks.d.ts',
    )

    const sourceFile = createSourceFile(
      project,
      `
        import type { Sitelink } from './sitelinks'

        export interface Entity {
          id: string
          sitelinks?: Record<string, Sitelink>
        }
      `,
    )

    expect(generateFormattedCode(sourceFile)).toBe(
      formatWithPrettier(`
        export const Url = Type.String()

        export type Url = Static<typeof Url>

        export const Sitelink = Type.Object({
          site: Type.String(),
          title: Type.String(),
          url: Type.Optional(Url),
        })

        export type Sitelink = Static<typeof Sitelink>

        export const Entity = Type.Object({
          id: Type.String(),
          sitelinks: Type.Optional(Type.Record(Type.String(), Sitelink)),
        })

        export type Entity = Static<typeof Entity>
      `),
    )
  })

  test('should include types that are actually referenced transitively', () => {
    // Create a scenario where a type is legitimately referenced transitively
    createSourceFile(
      project,
      `
        export type BaseId = string
        export type UserId = BaseId
        export type UnusedType = number // This should not be included
      `,
      'types.d.ts',
    )

    const sourceFile = createSourceFile(
      project,
      `
        import type { UserId } from './types'

        export interface User {
          id: UserId
        }
      `,
    )

    expect(generateFormattedCode(sourceFile)).toBe(
      formatWithPrettier(`
        export const BaseId = Type.String()

        export type BaseId = Static<typeof BaseId>

        export const UserId = BaseId

        export type UserId = Static<typeof UserId>

        export const User = Type.Object({
          id: UserId,
        })

        export type User = Static<typeof User>
      `),
    )
  })
})
