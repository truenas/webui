"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var action_1 = require("../../action");
var listen = function (element, events, options) { return action_1.default(function (_a) {
    var update = _a.update;
    var eventNames = events.split(' ').map(function (eventName) {
        element.addEventListener(eventName, update, options);
        return eventName;
    });
    return {
        stop: function () { return eventNames.forEach(function (eventName) { return element.removeEventListener(eventName, update, options); }); }
    };
}); };
exports.default = listen;
//# sourceMappingURL=index.js.map