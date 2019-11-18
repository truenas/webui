'use strict';var _utils;











function _load_utils() {return _utils = require('./utils');}var _normalize2;
function _load_normalize() {return _normalize2 = _interopRequireDefault(require('./normalize'));}var _resolve_config_path;
function _load_resolve_config_path() {return _resolve_config_path = _interopRequireDefault(require('./resolve_config_path'));}var _read_config_file_and_set_root_dir;
function _load_read_config_file_and_set_root_dir() {return _read_config_file_and_set_root_dir = _interopRequireDefault(require('./read_config_file_and_set_root_dir'));}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };} /**
                                                                                                                                                                                                                                                                       * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
                                                                                                                                                                                                                                                                       *
                                                                                                                                                                                                                                                                       * This source code is licensed under the MIT license found in the
                                                                                                                                                                                                                                                                       * LICENSE file in the root directory of this source tree.
                                                                                                                                                                                                                                                                       *
                                                                                                                                                                                                                                                                       * 
                                                                                                                                                                                                                                                                       */function readConfig(argv, packageRoot, // Whether it needs to look into `--config` arg passed to CLI.
// It only used to read initial config. If the initial config contains
// `project` property, we don't want to read `--config` value and rather
skipArgvConfigOption)




{
  let rawOptions;
  let configPath;

  // A JSON string was passed to `--config` argument and we can parse it
  // and use as is.
  if ((0, (_utils || _load_utils()).isJSONString)(argv.config)) {
    let config;
    try {
      config = JSON.parse(argv.config);
    } catch (e) {
      throw new Error(
      'There was an error while parsing the `--config` argument as a JSON string.');

    }

    // NOTE: we might need to resolve this dir to an absolute path in the future
    config.rootDir = config.rootDir || packageRoot;
    rawOptions = config;
    // A string passed to `--config`, which is either a direct path to the config
    // or a path to directory containing `package.json` or `jest.conf.js`
  } else if (!skipArgvConfigOption && typeof argv.config == 'string') {
    configPath = (0, (_resolve_config_path || _load_resolve_config_path()).default)(argv.config, process.cwd());
    rawOptions = (0, (_read_config_file_and_set_root_dir || _load_read_config_file_and_set_root_dir()).default)(configPath);
  } else {
    // Otherwise just try to find config in the current rootDir.
    configPath = (0, (_resolve_config_path || _load_resolve_config_path()).default)(packageRoot, process.cwd());
    rawOptions = (0, (_read_config_file_and_set_root_dir || _load_read_config_file_and_set_root_dir()).default)(configPath);
  }var _normalize =

  (0, (_normalize2 || _load_normalize()).default)(rawOptions, argv);const options = _normalize.options,hasDeprecationWarnings = _normalize.hasDeprecationWarnings;var _getConfigs =
  getConfigs(options);const globalConfig = _getConfigs.globalConfig,projectConfig = _getConfigs.projectConfig;
  return {
    configPath,
    globalConfig,
    hasDeprecationWarnings,
    projectConfig };

}

const getConfigs =
options =>
{
  return {
    globalConfig: Object.freeze({
      bail: options.bail,
      changedFilesWithAncestor: options.changedFilesWithAncestor,
      collectCoverage: options.collectCoverage,
      collectCoverageFrom: options.collectCoverageFrom,
      collectCoverageOnlyFrom: options.collectCoverageOnlyFrom,
      coverageDirectory: options.coverageDirectory,
      coverageReporters: options.coverageReporters,
      coverageThreshold: options.coverageThreshold,
      expand: options.expand,
      findRelatedTests: options.findRelatedTests,
      forceExit: options.forceExit,
      json: options.json,
      lastCommit: options.lastCommit,
      listTests: options.listTests,
      logHeapUsage: options.logHeapUsage,
      mapCoverage: options.mapCoverage,
      maxWorkers: options.maxWorkers,
      noSCM: undefined,
      noStackTrace: options.noStackTrace,
      nonFlagArgs: options.nonFlagArgs,
      notify: options.notify,
      onlyChanged: options.onlyChanged,
      outputFile: options.outputFile,
      projects: options.projects,
      replname: options.replname,
      reporters: options.reporters,
      rootDir: options.rootDir,
      runTestsByPath: options.runTestsByPath,
      silent: options.silent,
      testFailureExitCode: options.testFailureExitCode,
      testNamePattern: options.testNamePattern,
      testPathPattern: options.testPathPattern,
      testResultsProcessor: options.testResultsProcessor,
      updateSnapshot: options.updateSnapshot,
      useStderr: options.useStderr,
      verbose: options.verbose,
      watch: options.watch,
      watchAll: options.watchAll,
      watchman: options.watchman }),

    projectConfig: Object.freeze({
      automock: options.automock,
      browser: options.browser,
      cache: options.cache,
      cacheDirectory: options.cacheDirectory,
      clearMocks: options.clearMocks,
      coveragePathIgnorePatterns: options.coveragePathIgnorePatterns,
      cwd: options.cwd,
      displayName: options.displayName,
      globals: options.globals,
      haste: options.haste,
      moduleDirectories: options.moduleDirectories,
      moduleFileExtensions: options.moduleFileExtensions,
      moduleLoader: options.moduleLoader,
      moduleNameMapper: options.moduleNameMapper,
      modulePathIgnorePatterns: options.modulePathIgnorePatterns,
      modulePaths: options.modulePaths,
      name: options.name,
      resetMocks: options.resetMocks,
      resetModules: options.resetModules,
      resolver: options.resolver,
      rootDir: options.rootDir,
      roots: options.roots,
      runner: options.runner,
      setupFiles: options.setupFiles,
      setupTestFrameworkScriptFile: options.setupTestFrameworkScriptFile,
      skipNodeResolution: options.skipNodeResolution,
      snapshotSerializers: options.snapshotSerializers,
      testEnvironment: options.testEnvironment,
      testMatch: options.testMatch,
      testPathIgnorePatterns: options.testPathIgnorePatterns,
      testRegex: options.testRegex,
      testRunner: options.testRunner,
      testURL: options.testURL,
      timers: options.timers,
      transform: options.transform,
      transformIgnorePatterns: options.transformIgnorePatterns,
      unmockedModulePathPatterns: options.unmockedModulePathPatterns,
      watchPathIgnorePatterns: options.watchPathIgnorePatterns }) };


};

module.exports = {
  getTestEnvironment: (_utils || _load_utils()).getTestEnvironment,
  isJSONString: (_utils || _load_utils()).isJSONString,
  normalize: (_normalize2 || _load_normalize()).default,
  readConfig };