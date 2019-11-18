'use strict';var _mkdirp;








function _load_mkdirp() {return _mkdirp = _interopRequireDefault(require('mkdirp'));}var _buffered_console;

function _load_buffered_console() {return _buffered_console = _interopRequireDefault(require('./buffered_console'));}var _clear_line;
function _load_clear_line() {return _clear_line = _interopRequireDefault(require('./clear_line'));}var _Console;
function _load_Console() {return _Console = _interopRequireDefault(require('./Console'));}var _fake_timers;
function _load_fake_timers() {return _fake_timers = _interopRequireDefault(require('./fake_timers'));}var _format_test_results;
function _load_format_test_results() {return _format_test_results = _interopRequireDefault(require('./format_test_results'));}var _get_console_output;
function _load_get_console_output() {return _get_console_output = _interopRequireDefault(require('./get_console_output'));}var _install_common_globals;
function _load_install_common_globals() {return _install_common_globals = _interopRequireDefault(require('./install_common_globals'));}var _null_console;
function _load_null_console() {return _null_console = _interopRequireDefault(require('./null_console'));}var _set_global;
function _load_set_global() {return _set_global = _interopRequireDefault(require('./set_global'));}var _validate_cli_options;
function _load_validate_cli_options() {return _validate_cli_options = _interopRequireDefault(require('./validate_cli_options'));}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const createDirectory = path => {
  try {
    (_mkdirp || _load_mkdirp()).default.sync(path, '777');
  } catch (e) {
    if (e.code !== 'EEXIST') {
      throw e;
    }
  }
}; /**
    * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
    *
    * This source code is licensed under the MIT license found in the
    * LICENSE file in the root directory of this source tree.
    *
    * 
    */module.exports = { BufferedConsole: (_buffered_console || _load_buffered_console()).default, Console: (_Console || _load_Console()).default, FakeTimers: (_fake_timers || _load_fake_timers()).default, NullConsole: (_null_console || _load_null_console()).default, clearLine: (_clear_line || _load_clear_line()).default,
  createDirectory,
  formatTestResults: (_format_test_results || _load_format_test_results()).default,
  getConsoleOutput: (_get_console_output || _load_get_console_output()).default,
  installCommonGlobals: (_install_common_globals || _load_install_common_globals()).default,
  setGlobal: (_set_global || _load_set_global()).default,
  validateCLIOptions: (_validate_cli_options || _load_validate_cli_options()).default };