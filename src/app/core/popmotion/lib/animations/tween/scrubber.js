"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var style_value_types_1 = require("style-value-types");
var action_1 = require("../../action");
var vector_1 = require("../../action/vector");
var calc_1 = require("../../calc");
var easing_1 = require("../../easing");
var scrubber = function (_a) {
    var _b = _a.from, from = _b === void 0 ? 0 : _b, _c = _a.to, to = _c === void 0 ? 1 : _c, _d = _a.ease, ease = _d === void 0 ? easing_1.linear : _d;
    return action_1.default(function (_a) {
        var update = _a.update;
        return ({
            seek: function (progress) { return update(progress); }
        });
    }).pipe(ease, function (v) { return calc_1.getValueFromProgress(from, to, v); });
};
var vectorScrubber = vector_1.default(scrubber, {
    ease: function (func) { return typeof func === 'function'; },
    from: style_value_types_1.number.test,
    to: style_value_types_1.number.test
});
exports.default = vectorScrubber;
//# sourceMappingURL=scrubber.js.map