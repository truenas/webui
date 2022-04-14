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
  collectCoverage: false,
  collectCoverageFrom: ["**/*.ts"],
  coverageReporters: ['html', 'json'],
  coverageDirectory: 'coverage/webui',
  moduleDirectories: ['node_modules', 'src'],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths || {}, {
    prefix: '<rootDir>/',
    "^@/(.)$": "/src/$1"
  }),
};
