'use strict';var _jestUtil;












function _load_jestUtil() {return _jestUtil = require('jest-util');}var _jestMock;
function _load_jestMock() {return _jestMock = _interopRequireDefault(require('jest-mock'));}var _jsdom;
function _load_jsdom() {return _jsdom = _interopRequireDefault(require('jsdom'));}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

class JSDOMEnvironment {





  constructor(config) {
    // lazy require
    this.document = (_jsdom || _load_jsdom()).default.jsdom('<!DOCTYPE html>', {
      url: config.testURL });

    const global = this.global = this.document.defaultView;
    // Node's error-message stack size is limited at 10, but it's pretty useful
    // to see more than that when a test fails.
    this.global.Error.stackTraceLimit = 100;
    (0, (_jestUtil || _load_jestUtil()).installCommonGlobals)(global, config.globals);

    this.moduleMocker = new (_jestMock || _load_jestMock()).default.ModuleMocker(global);
    this.fakeTimers = new (_jestUtil || _load_jestUtil()).FakeTimers(global, this.moduleMocker, config);
  }

  dispose() {
    if (this.fakeTimers) {
      this.fakeTimers.dispose();
    }
    if (this.global) {
      this.global.close();
    }
    this.global = null;
    this.document = null;
    this.fakeTimers = null;
  }

  runScript(script) {
    if (this.global) {
      return (_jsdom || _load_jsdom()).default.evalVMScript(this.global, script);
    }
    return null;
  }} /**
      * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
      *
      * This source code is licensed under the MIT license found in the
      * LICENSE file in the root directory of this source tree.
      * 
      */module.exports = JSDOMEnvironment;