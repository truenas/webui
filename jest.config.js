const { pathsToModuleNameMapper } = require('ts-jest/utils');
const { compilerOptions } = require('./tsconfig');
const { defaultsESM } = require('jest-preset-angular/presets');

module.exports = {
  preset: 'jest-preset-angular/presets/defaults-esm',
  testMatch: ['**/+(*.)+(spec).+(ts)'],
  setupFilesAfterEnv: ['<rootDir>/src/setup-jest.ts'],
  collectCoverage: true,
  coverageReporters: ['html'],
  coverageDirectory: 'coverage/my-app',
  moduleDirectories: ['node_modules', 'src'],
  transformIgnorePatterns: ['node_modules/(?!tslib)'],
};
