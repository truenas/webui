"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var transpile_if_ts_1 = require("./transpile-if-ts");
function defaultRetrieveFileHandler(path) {
    path = path.trim();
    var contents;
    try {
        contents = fs.readFileSync(path, 'utf8');
        contents = transpile_if_ts_1.transpileIfTypescript(path, contents);
    }
    catch (e) {
        contents = null;
    }
    return contents;
}
exports.defaultRetrieveFileHandler = defaultRetrieveFileHandler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmYXVsdC1yZXRyaWV2ZS1maWxlLWhhbmRsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvZGVmYXVsdC1yZXRyaWV2ZS1maWxlLWhhbmRsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSx1QkFBeUI7QUFDekIscURBQTBEO0FBRTFELG9DQUEyQyxJQUFJO0lBRTdDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7SUFRbkIsSUFBSSxRQUFnQixDQUFDO0lBQ3JCLElBQUksQ0FBQztRQUNILFFBQVEsR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztRQUN6QyxRQUFRLEdBQUcsdUNBQXFCLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQ25ELENBQUM7SUFBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ1gsUUFBUSxHQUFHLElBQUksQ0FBQztJQUNsQixDQUFDO0lBRUQsTUFBTSxDQUFDLFFBQVEsQ0FBQztBQUNsQixDQUFDO0FBbkJELGdFQW1CQyJ9