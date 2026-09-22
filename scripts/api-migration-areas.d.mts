/**
 * Types for `api-migration-areas.mjs`.
 *
 * The list itself has to be `.mjs` — `eslint.config.mjs` imports it at config-load time, where
 * nothing compiles TypeScript — but `check-api-migration.ts` is type-checked like the rest of the
 * repo, and without this it would read every export as `any`.
 */

export declare const migratedApiPaths: string[];
export declare const apiMigrationExemptPaths: string[];
export declare const legacyApiImportPatterns: string[];
export declare const legacyApiImportPattern: RegExp;
export declare const typedApiImportPattern: RegExp;
export declare function migratedApiFilePatterns(): string[];
export declare function isMigratedPath(file: string): boolean;
export declare function isExemptPath(file: string): boolean;
