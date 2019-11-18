"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tsc = require("typescript");
var utils_1 = require("./utils");
function transpileIfTypescript(path, contents, config) {
    if (path && (path.endsWith('.tsx') || path.endsWith('.ts'))) {
        var transpiled = tsc.transpileModule(contents, {
            compilerOptions: utils_1.getTSConfig(config || utils_1.mockGlobalTSConfigSchema(global), true),
            fileName: path,
        });
        return transpiled.outputText;
    }
    return contents;
}
exports.transpileIfTypescript = transpileIfTypescript;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNwaWxlLWlmLXRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3RyYW5zcGlsZS1pZi10cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLGdDQUFrQztBQUNsQyxpQ0FBZ0U7QUFFaEUsK0JBQXNDLElBQUksRUFBRSxRQUFRLEVBQUUsTUFBTztJQUMzRCxFQUFFLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDNUQsSUFBSSxVQUFVLEdBQUcsR0FBRyxDQUFDLGVBQWUsQ0FBQyxRQUFRLEVBQUU7WUFDN0MsZUFBZSxFQUFFLG1CQUFXLENBQzFCLE1BQU0sSUFBSSxnQ0FBd0IsQ0FBQyxNQUFNLENBQUMsRUFDMUMsSUFBSSxDQUNMO1lBQ0QsUUFBUSxFQUFFLElBQUk7U0FDZixDQUFDLENBQUM7UUFFSCxNQUFNLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQztJQUMvQixDQUFDO0lBQ0QsTUFBTSxDQUFDLFFBQVEsQ0FBQztBQUNsQixDQUFDO0FBYkQsc0RBYUMifQ==