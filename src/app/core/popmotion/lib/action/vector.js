"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
            t[p[i]] = s[p[i]];
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var style_value_types_1 = require("style-value-types");
var composite_1 = require("../compositors/composite");
var parallel_1 = require("../compositors/parallel");
var transformers_1 = require("../transformers");
var hey_listen_1 = require("hey-listen");
var createVectorTests = function (typeTests) {
    var testNames = Object.keys(typeTests);
    var isVectorProp = function (prop, key) {
        return prop !== undefined && !typeTests[key](prop);
    };
    var getVectorKeys = function (props) {
        return testNames.reduce(function (vectorKeys, key) {
            if (isVectorProp(props[key], key))
                vectorKeys.push(key);
            return vectorKeys;
        }, []);
    };
    var testVectorProps = function (props) {
        return props &&
            testNames.reduce(function (isVector, key) { return isVector || isVectorProp(props[key], key); }, false);
    };
    return { getVectorKeys: getVectorKeys, testVectorProps: testVectorProps };
};
var unitTypes = [style_value_types_1.px, style_value_types_1.percent, style_value_types_1.degrees, style_value_types_1.vh, style_value_types_1.vw];
var findUnitType = function (prop) { return unitTypes.find(function (type) { return type.test(prop); }); };
var isUnitProp = function (prop) { return Boolean(findUnitType(prop)); };
var createAction = function (action, props) { return action(props); };
var reduceArrayValue = function (i) { return function (props, key) {
    props[key] = props[key][i];
    return props;
}; };
var createArrayAction = function (action, props, vectorKeys) {
    var firstVectorKey = vectorKeys[0];
    var actionList = props[firstVectorKey].map(function (v, i) {
        var childActionProps = vectorKeys.reduce(reduceArrayValue(i), __assign({}, props));
        return getActionCreator(v)(action, childActionProps);
    });
    return parallel_1.default.apply(void 0, actionList);
};
var reduceObjectValue = function (key) { return function (props, propKey) {
    props[propKey] = props[propKey][key];
    return props;
}; };
var createObjectAction = function (action, props, vectorKeys) {
    var firstVectorKey = vectorKeys[0];
    var actionMap = Object.keys(props[firstVectorKey]).reduce(function (map, key) {
        var childActionProps = vectorKeys.reduce(reduceObjectValue(key), __assign({}, props));
        map[key] = getActionCreator(props[firstVectorKey][key])(action, childActionProps);
        return map;
    }, {});
    return composite_1.default(actionMap);
};
var createUnitAction = function (action, _a) {
    var from = _a.from, to = _a.to, props = __rest(_a, ["from", "to"]);
    var unitType = findUnitType(from) || findUnitType(to);
    var transform = unitType.transform, parse = unitType.parse;
    return action(__assign({}, props, { from: typeof from === 'string' ? parse(from) : from, to: typeof to === 'string' ? parse(to) : to })).pipe(transform);
};
var createColorAction = function (action, _a) {
    var from = _a.from, to = _a.to, props = __rest(_a, ["from", "to"]);
    return action(__assign({}, props, { from: 0, to: 1 })).pipe(transformers_1.blendColor(from, to), style_value_types_1.color.transform);
};
var createComplexAction = function (action, _a) {
    var from = _a.from, to = _a.to, props = __rest(_a, ["from", "to"]);
    var valueTemplate = style_value_types_1.complex.createTransformer(from);
    hey_listen_1.invariant(valueTemplate(from) === style_value_types_1.complex.createTransformer(to)(from), "Values '" + from + "' and '" + to + "' are of different format, or a value might have changed value type.");
    return action(__assign({}, props, { from: 0, to: 1 })).pipe(transformers_1.blendArray(style_value_types_1.complex.parse(from), style_value_types_1.complex.parse(to)), valueTemplate);
};
var createVectorAction = function (action, typeTests) {
    var _a = createVectorTests(typeTests), testVectorProps = _a.testVectorProps, getVectorKeys = _a.getVectorKeys;
    var vectorAction = function (props) {
        var isVector = testVectorProps(props);
        if (!isVector)
            return action(props);
        var vectorKeys = getVectorKeys(props);
        var testKey = vectorKeys[0];
        var testProp = props[testKey];
        return getActionCreator(testProp)(action, props, vectorKeys);
    };
    return vectorAction;
};
var getActionCreator = function (prop) {
    var actionCreator = createAction;
    if (typeof prop === 'number') {
        actionCreator = createAction;
    }
    else if (Array.isArray(prop)) {
        actionCreator = createArrayAction;
    }
    else if (isUnitProp(prop)) {
        actionCreator = createUnitAction;
    }
    else if (style_value_types_1.color.test(prop)) {
        actionCreator = createColorAction;
    }
    else if (style_value_types_1.complex.test(prop)) {
        actionCreator = createComplexAction;
    }
    else if (typeof prop === 'object') {
        actionCreator = createObjectAction;
    }
    return actionCreator;
};
exports.default = createVectorAction;
//# sourceMappingURL=vector.js.map