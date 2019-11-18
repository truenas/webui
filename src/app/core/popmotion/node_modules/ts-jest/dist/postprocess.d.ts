import { CompilerOptions } from 'typescript/lib/typescript';
import { FullJestConfig, PostProcessHook, TsJestConfig } from './jest-types';
export declare const getPostProcessHook: (tsCompilerOptions: CompilerOptions, jestConfig: Partial<FullJestConfig>, tsJestConfig: TsJestConfig) => PostProcessHook;
