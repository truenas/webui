"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var babel = require("babel-core");
var babel_plugin_istanbul_1 = require("babel-plugin-istanbul");
var jestPreset = require("babel-preset-jest");
function createBabelTransformer(options) {
    options = __assign({}, options, { plugins: options.plugins || [], presets: (options.presets || []).concat([jestPreset]), retainLines: true, sourceMaps: 'inline' });
    delete options.cacheDirectory;
    delete options.filename;
    return function (src, filename, config, transformOptions) {
        var theseOptions = Object.assign({ filename: filename }, options);
        if (transformOptions && transformOptions.instrument) {
            theseOptions.auxiliaryCommentBefore = ' istanbul ignore next ';
            theseOptions.plugins = theseOptions.plugins.concat([
                [
                    babel_plugin_istanbul_1.default,
                    {
                        cwd: config.rootDir,
                        exclude: [],
                    },
                ],
            ]);
        }
        return babel.transform(src, theseOptions).code;
    };
}
exports.getPostProcessHook = function (tsCompilerOptions, jestConfig, tsJestConfig) {
    if (tsJestConfig.skipBabel) {
        return function (src) { return src; };
    }
    var plugins = Array.from(tsJestConfig.babelConfig && tsJestConfig.babelConfig.plugins || []);
    if (tsCompilerOptions.allowSyntheticDefaultImports) {
        plugins.push('transform-es2015-modules-commonjs');
    }
    return createBabelTransformer(__assign({}, tsJestConfig.babelConfig, { babelrc: tsJestConfig.useBabelrc || false, plugins: plugins, presets: tsJestConfig.babelConfig ? tsJestConfig.babelConfig.presets : [] }));
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9zdHByb2Nlc3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvcG9zdHByb2Nlc3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUlBLGtDQUFvQztBQUNwQywrREFBbUQ7QUFDbkQsOENBQWdEO0FBV2hELGdDQUFnQyxPQUE4QjtJQUM1RCxPQUFPLGdCQUNGLE9BQU8sSUFDVixPQUFPLEVBQUUsT0FBTyxDQUFDLE9BQU8sSUFBSSxFQUFFLEVBQzlCLE9BQU8sRUFBRSxDQUFDLE9BQU8sQ0FBQyxPQUFPLElBQUksRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsRUFHckQsV0FBVyxFQUFFLElBQUksRUFHakIsVUFBVSxFQUFFLFFBQVEsR0FDckIsQ0FBQztJQUNGLE9BQU8sT0FBTyxDQUFDLGNBQWMsQ0FBQztJQUM5QixPQUFPLE9BQU8sQ0FBQyxRQUFRLENBQUM7SUFFeEIsTUFBTSxDQUFDLFVBQ0wsR0FBVyxFQUNYLFFBQWdCLEVBQ2hCLE1BQWtCLEVBQ2xCLGdCQUFrQztRQUVsQyxJQUFNLFlBQVksR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsUUFBUSxVQUFBLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUMxRCxFQUFFLENBQUMsQ0FBQyxnQkFBZ0IsSUFBSSxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1lBQ3BELFlBQVksQ0FBQyxzQkFBc0IsR0FBRyx3QkFBd0IsQ0FBQztZQUUvRCxZQUFZLENBQUMsT0FBTyxHQUFHLFlBQVksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDO2dCQUNqRDtvQkFDRSwrQkFBYztvQkFDZDt3QkFFRSxHQUFHLEVBQUUsTUFBTSxDQUFDLE9BQU87d0JBQ25CLE9BQU8sRUFBRSxFQUFFO3FCQUNaO2lCQUNGO2FBQ0YsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVELE1BQU0sQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxZQUFZLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFDakQsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQUVZLFFBQUEsa0JBQWtCLEdBQUcsVUFDaEMsaUJBQWtDLEVBQ2xDLFVBQXNCLEVBQ3RCLFlBQTBCO0lBRTFCLEVBQUUsQ0FBQyxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBQzNCLE1BQU0sQ0FBQyxVQUFBLEdBQUcsSUFBSSxPQUFBLEdBQUcsRUFBSCxDQUFHLENBQUM7SUFDcEIsQ0FBQztJQUVELElBQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLFdBQVcsSUFBSSxZQUFZLENBQUMsV0FBVyxDQUFDLE9BQU8sSUFBSSxFQUFFLENBQUMsQ0FBQztJQUUvRixFQUFFLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDLENBQUM7UUFDbkQsT0FBTyxDQUFDLElBQUksQ0FBQyxtQ0FBbUMsQ0FBQyxDQUFDO0lBQ3BELENBQUM7SUFFRCxNQUFNLENBQUMsc0JBQXNCLGNBQ3hCLFlBQVksQ0FBQyxXQUFXLElBQzNCLE9BQU8sRUFBRSxZQUFZLENBQUMsVUFBVSxJQUFJLEtBQUssRUFDekMsT0FBTyxTQUFBLEVBQ1AsT0FBTyxFQUFFLFlBQVksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQ3pFLENBQUM7QUFDTCxDQUFDLENBQUMifQ==