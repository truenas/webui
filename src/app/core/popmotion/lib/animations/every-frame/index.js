"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var framesync_1 = require("framesync");
var action_1 = require("../../action");
var frame = function () { return action_1.default(function (_a) {
    var update = _a.update;
    var isActive = true;
    var startTime = framesync_1.currentTime();
    var nextFrame = function () {
        if (!isActive)
            return;
        update(Math.max(framesync_1.currentFrameTime() - startTime, 0));
        framesync_1.onFrameUpdate(nextFrame);
    };
    framesync_1.onFrameUpdate(nextFrame);
    return {
        stop: function () { return isActive = false; }
    };
}); };
exports.default = frame;
//# sourceMappingURL=index.js.map