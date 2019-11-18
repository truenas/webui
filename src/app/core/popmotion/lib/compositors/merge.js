"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var action_1 = require("../action");
var merge = function () {
    var actions = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        actions[_i] = arguments[_i];
    }
    return action_1.default(function (observer) {
        var subs = actions.map(function (thisAction) { return thisAction.start(observer); });
        return {
            stop: function () { return subs.forEach(function (sub) { return sub.stop(); }); }
        };
    });
};
exports.default = merge;
//# sourceMappingURL=merge.js.map