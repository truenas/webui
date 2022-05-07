const { pathsToModuleNameMapper } = require('ts-jest/utils');
const { compilerOptions } = require('./tsconfig');

require('jest-preset-angular/ngcc-jest-processor');

// Deliberately set to not UTC.
process.env.TZ = 'Europe/Kiev';

module.exports = {
  preset: 'jest-preset-angular',
  // roots: ['<rootDir>/src/'],
  // testMatch: ['**/+(*.)+(spec).+(ts)'],
  setupFilesAfterEnv: ['<rootDir>/src/setup-jest.ts'],
  collectCoverage: false,
  collectCoverageFrom: ["**/*.ts"],
  coverageReporters: ['html', 'json'],
  coverageDirectory: 'coverage/webui',
  moduleDirectories: ['node_modules', 'src'],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths || {}),
  testPathIgnorePatterns: [
    // "<rootDir>/node_modules/(?!date-fns-tz|date-fns)",
    "node_modules/(?!(date-fns-tz|date-fns))",
    "<rootDir>/dist/"
  ],
  // globals: {
  //   "ts-jest": {
  //     "tsconfig": "<rootDir>/tsconfig.spec.json",
  //     "stringifyContentPathRegex": "\\.html$"
  //   }
  // }
};
