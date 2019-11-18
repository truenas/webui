"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var framesync_1 = require("framesync");
var action_1 = require("../../action");
var calc_1 = require("../../calc");
var easing_1 = require("../../easing");
var transformers_1 = require("../../transformers");
var every_frame_1 = require("../every-frame");
var scrubber_1 = require("./scrubber");
var clampProgress = transformers_1.clamp(0, 1);
var tween = function (props) {
    if (props === void 0) { props = {}; }
    return action_1.default(function (_a) {
        var update = _a.update, complete = _a.complete;
        var _b = props.duration, duration = _b === void 0 ? 300 : _b, _c = props.ease, ease = _c === void 0 ? easing_1.easeOut : _c, _d = props.flip, flip = _d === void 0 ? 0 : _d, _e = props.loop, loop = _e === void 0 ? 0 : _e, _f = props.yoyo, yoyo = _f === void 0 ? 0 : _f;
        var _g = props.from, from = _g === void 0 ? 0 : _g, _h = props.to, to = _h === void 0 ? 1 : _h, _j = props.elapsed, elapsed = _j === void 0 ? 0 : _j, _k = props.playDirection, playDirection = _k === void 0 ? 1 : _k, _l = props.flipCount, flipCount = _l === void 0 ? 0 : _l, _m = props.yoyoCount, yoyoCount = _m === void 0 ? 0 : _m, _o = props.loopCount, loopCount = _o === void 0 ? 0 : _o;
        var playhead = scrubber_1.default({ from: from, to: to, ease: ease }).start(update);
        var progress = 0;
        var tweenTimer;
        var isActive = false;
        var reverseTween = function () { return playDirection *= -1; };
        var isTweenComplete = function () {
            var isComplete = (playDirection === 1)
                ? isActive && elapsed >= duration
                : isActive && elapsed <= 0;
            if (!isComplete)
                return false;
            if (isComplete && !loop && !flip && !yoyo)
                return true;
            var isStepTaken = false;
            if (loop && loopCount < loop) {
                elapsed = 0;
                loopCount++;
                isStepTaken = true;
            }
            else if (flip && flipCount < flip) {
                elapsed = duration - elapsed;
                _a = [to, from], from = _a[0], to = _a[1];
                playhead = scrubber_1.default({ from: from, to: to, ease: ease }).start(update);
                flipCount++;
                isStepTaken = true;
            }
            else if (yoyo && yoyoCount < yoyo) {
                reverseTween();
                yoyoCount++;
                isStepTaken = true;
            }
            return !isStepTaken;
            var _a;
        };
        var updateTween = function () {
            progress = clampProgress(calc_1.getProgressFromValue(0, duration, elapsed));
            playhead.seek(progress);
        };
        var startTimer = function () {
            isActive = true;
            tweenTimer = every_frame_1.default().start(function () {
                elapsed += framesync_1.timeSinceLastFrame() * playDirection;
                updateTween();
                if (isTweenComplete() && complete) {
                    tweenTimer.stop();
                    framesync_1.onFrameUpdate(complete, true);
                }
            });
        };
        var stopTimer = function () {
            isActive = false;
            if (tweenTimer)
                tweenTimer.stop();
        };
        startTimer();
        return {
            isActive: function () { return isActive; },
            getElapsed: function () { return transformers_1.clamp(0, duration)(elapsed); },
            getProgress: function () { return progress; },
            stop: function () {
                stopTimer();
            },
            pause: function () {
                stopTimer();
                return this;
            },
            resume: function () {
                startTimer();
                return this;
            },
            seek: function (newProgress) {
                elapsed = calc_1.getValueFromProgress(0, duration, newProgress);
                framesync_1.onFrameUpdate(updateTween, true);
                return this;
            },
            reverse: function () {
                reverseTween();
                return this;
            }
        };
    });
};
exports.default = tween;
//# sourceMappingURL=index.js.map