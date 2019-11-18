"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Observer = (function () {
    function Observer(_a, observer) {
        var middleware = _a.middleware, onComplete = _a.onComplete;
        var _this = this;
        this.isActive = true;
        this.update = function (v) {
            if (_this.observer.update)
                _this.updateObserver(v);
        };
        this.complete = function () {
            if (_this.observer.complete && _this.isActive)
                _this.observer.complete();
            if (_this.onComplete)
                _this.onComplete();
            _this.isActive = false;
        };
        this.error = function (err) {
            if (_this.observer.error && _this.isActive)
                _this.observer.error(err);
            _this.isActive = false;
        };
        this.observer = observer;
        this.updateObserver = function (v) { return observer.update(v); };
        this.onComplete = onComplete;
        if (observer.update && middleware && middleware.length) {
            middleware.forEach(function (m) { return _this.updateObserver = m(_this.updateObserver, _this.complete); });
        }
    }
    return Observer;
}());
exports.Observer = Observer;
exports.default = (function (observerCandidate, _a, onComplete) {
    var middleware = _a.middleware;
    if (typeof observerCandidate === 'function') {
        return new Observer({ middleware: middleware, onComplete: onComplete }, { update: observerCandidate });
    }
    else {
        return new Observer({ middleware: middleware, onComplete: onComplete }, observerCandidate);
    }
});
//# sourceMappingURL=index.js.map