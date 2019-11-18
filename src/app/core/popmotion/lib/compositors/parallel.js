"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var multi_1 = require("./multi");
var parallel = multi_1.default({
    getOutput: function () { return ([]); },
    getCount: function (subs) { return subs.length; },
    getFirst: function (subs) { return subs[0]; },
    mapApi: function (subs, methodName) { return function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return subs.map(function (sub, i) {
            if (sub[methodName]) {
                return Array.isArray(args[0])
                    ? sub[methodName](args[0][i])
                    : sub[methodName].apply(sub, args);
            }
        });
    }; },
    setProp: function (output, name, v) { return output[name] = v; },
    startActions: function (actions, starter) { return actions.map(function (action, i) { return starter(action, i); }); }
});
exports.default = (function () {
    var actions = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        actions[_i] = arguments[_i];
    }
    return parallel(actions);
});
//# sourceMappingURL=parallel.js.map