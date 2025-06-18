const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig');

// Deliberately set to not UTC.
process.env.TZ = 'Europe/Kiev';

module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/src/setup-jest.ts'],
  collectCoverage: false,
  collectCoverageFrom: ["./src/**/*.ts"],
  coverageReporters: ['html', 'json'],
  coverageDirectory: 'coverage/webui',
  moduleDirectories: ['node_modules', 'src'],
  cacheDirectory: "<rootDir>/.jest/cache",
  moduleNameMapper: {
    ...pathsToModuleNameMapper(compilerOptions.paths || {}),
  },
  testPathIgnorePatterns: [
    '<rootDir>/dist/',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!.*\\.mjs$|is-cidr|ip-regex|cidr-regex|lodash-es|internmap|d3|delaunator|cheerio|robust-predicates|@angular|@ngneat|@ngrx|@ngx-translate|ng-mocks|ngx-translate-messageformat-compiler)'
  ],
  reporters: [
    "default",
    [
      "jest-junit",
      {
        classNameTemplate: "{filepath}",
        outputDirectory: "<rootDir>/coverage/webui"
      },
    ]
  ],
  clearMocks: true,
};
