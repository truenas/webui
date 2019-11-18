"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var action_1 = require("../action");
var delay = function (timeToDelay) { return action_1.default(function (_a) {
    var complete = _a.complete;
    var timeout = setTimeout(complete, timeToDelay);
    return {
        stop: function () { return clearTimeout(timeout); }
    };
}); };
exports.default = delay;
//# sourceMappingURL=delay.js.map