"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var action_1 = require("../action");
var calc_1 = require("../calc");
var parallel_1 = require("./parallel");
var crossfade = function (a, b) { return action_1.default(function (observer) {
    var balance = 0;
    var fadable = parallel_1.default(a, b).start(__assign({}, observer, { update: function (_a) {
            var va = _a[0], vb = _a[1];
            observer.update(calc_1.getValueFromProgress(va, vb, balance));
        } }));
    return {
        setBalance: function (v) { return balance = v; },
        stop: function () { return fadable.stop(); }
    };
}); };
exports.default = crossfade;
//# sourceMappingURL=crossfade.js.map