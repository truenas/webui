"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chain_1 = require("./chain");
var delay_1 = require("./delay");
var parallel_1 = require("./parallel");
var stagger = function (actions, interval) {
    var intervalIsNumber = typeof interval === 'number';
    var actionsWithDelay = actions.map(function (a, i) {
        var timeToDelay = intervalIsNumber ? interval * i : interval(i);
        return chain_1.default(delay_1.default(timeToDelay), a);
    });
    return parallel_1.default.apply(void 0, actionsWithDelay);
};
exports.default = stagger;
//# sourceMappingURL=stagger.js.map