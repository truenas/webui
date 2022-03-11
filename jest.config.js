const { pathsToModuleNameMapper } = require('ts-jest/utils');
const { compilerOptions } = require('./tsconfig');

require('jest-preset-angular/ngcc-jest-processor');

// Deliberately set to not UTC.
process.env.TZ = 'Europe/Kiev';

module.exports = {
  preset: 'jest-preset-angular',
  roots: ['<rootDir>/src/'],
  testMatch: ['**/+(*.)+(spec).+(ts)'],
  setupFilesAfterEnv: ['<rootDir>/src/setup-jest.ts'],
  collectCoverage: true,
  coverageReporters: ['html'],
  coverageDirectory: 'coverage/my-app',
  moduleDirectories: ['node_modules', 'src'],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths || {}, {
    prefix: '<rootDir>/',
    "^@/(.)$": "/src/$1"
  }),
  coverageThreshold: {
    global: {
      lines: 0,
      branches: 0,
      functions: 0,
      statements: 0
    },
  },
};
