import { dirname, resolve, extname, normalize, sep } from 'path';
import builtins from 'builtin-modules';
import resolveId from 'resolve';
import isModule from 'is-module';
import fs from 'fs';

var ES6_BROWSER_EMPTY = resolve( __dirname, '../src/empty.js' );
var CONSOLE_WARN = function () {
	var args = [], len = arguments.length;
	while ( len-- ) args[ len ] = arguments[ len ];

	return console.warn.apply( console, args );
}; // eslint-disable-line no-console
// It is important that .mjs occur before .js so that Rollup will interpret npm modules
// which deploy both ESM .mjs and CommonJS .js files as ESM.
var DEFAULT_EXTS = [ '.mjs', '.js', '.json', '.node' ];

var readFileCache = {};
var readFileAsync = function (file) { return new Promise(function (fulfil, reject) { return fs.readFile(file, function (err, contents) { return err ? reject(err) : fulfil(contents); }); }); };
var statAsync = function (file) { return new Promise(function (fulfil, reject) { return fs.stat(file, function (err, contents) { return err ? reject(err) : fulfil(contents); }); }); };
function cachedReadFile (file, cb) {
	if (file in readFileCache === false) {
		readFileCache[file] = readFileAsync(file).catch(function (err) {
			delete readFileCache[file];
			throw err;
		});
	}
	readFileCache[file].then(function (contents) { return cb(null, contents); }, cb);
}

var isFileCache = {};
function cachedIsFile (file, cb) {
	if (file in isFileCache === false) {
		isFileCache[file] = statAsync(file)
			.then(
				function (stat) { return stat.isFile(); },
				function (err) {
					if (err.code == 'ENOENT') { return false; }
					delete isFileCache[file];
					throw err;
				});
	}
	isFileCache[file].then(function (contents) { return cb(null, contents); }, cb);
}

var resolveIdAsync = function (file, opts) { return new Promise(function (fulfil, reject) { return resolveId(file, opts, function (err, contents) { return err ? reject(err) : fulfil(contents); }); }); };

function nodeResolve ( options ) {
	if ( options === void 0 ) options = {};

	var useModule = options.module !== false;
	var useMain = options.main !== false;
	var useJsnext = options.jsnext === true;
	var isPreferBuiltinsSet = options.preferBuiltins === true || options.preferBuiltins === false;
	var preferBuiltins = isPreferBuiltinsSet ? options.preferBuiltins : true;
	var customResolveOptions = options.customResolveOptions || {};
	var jail = options.jail;
	var only = Array.isArray(options.only)
		? options.only.map(function (o) { return o instanceof RegExp
			? o
			: new RegExp('^' + String(o).replace(/[\\^$*+?.()|[\]{}]/g, '\\$&') + '$'); }
		)
		: null;
	var browserMapCache = {};

	var onwarn = options.onwarn || CONSOLE_WARN;

	if ( options.skip ) {
		throw new Error( 'options.skip is no longer supported — you should use the main Rollup `external` option instead' );
	}

	if ( !useModule && !useMain && !useJsnext ) {
		throw new Error( "At least one of options.module, options.main or options.jsnext must be true" );
	}

	var preserveSymlinks;

	return {
		name: 'node-resolve',

		options: function options ( options$1 ) {
			preserveSymlinks = options$1.preserveSymlinks;
		},

		onwrite: function onwrite () {
			isFileCache = {};
			readFileCache = {};
		},

		resolveId: function resolveId$$1 ( importee, importer ) {
			if ( /\0/.test( importee ) ) { return null; } // ignore IDs with null character, these belong to other plugins

			// disregard entry module
			if ( !importer ) { return null; }

			if (options.browser && browserMapCache[importer]) {
				var resolvedImportee = resolve( dirname( importer ), importee );
				var browser = browserMapCache[importer];
				if (browser[importee] === false || browser[resolvedImportee] === false) {
					return ES6_BROWSER_EMPTY;
				}
				if (browser[importee] || browser[resolvedImportee] || browser[resolvedImportee + '.js'] || browser[resolvedImportee + '.json']) {
					importee = browser[importee] || browser[resolvedImportee] || browser[resolvedImportee + '.js'] || browser[resolvedImportee + '.json'];
				}
			}


			var parts = importee.split( /[/\\]/ );
			var id = parts.shift();

			if ( id[0] === '@' && parts.length ) {
				// scoped packages
				id += "/" + (parts.shift());
			} else if ( id[0] === '.' ) {
				// an import relative to the parent dir of the importer
				id = resolve( importer, '..', importee );
			}

			if (only && !only.some(function (pattern) { return pattern.test(id); })) { return null; }

			var disregardResult = false;
			var packageBrowserField = false;
			var extensions = options.extensions || DEFAULT_EXTS;

			var resolveOptions = {
				basedir: dirname( importer ),
				packageFilter: function packageFilter ( pkg, pkgPath ) {
					var pkgRoot = dirname( pkgPath );
					if (options.browser && typeof pkg[ 'browser' ] === 'object') {
						packageBrowserField = Object.keys(pkg[ 'browser' ]).reduce(function (browser, key) {
							var resolved = pkg[ 'browser' ][ key ] === false ? false : resolve( pkgRoot, pkg[ 'browser' ][ key ] );
							browser[ key ] = resolved;
							if ( key[0] === '.' ) {
								var absoluteKey = resolve( pkgRoot, key );
								browser[ absoluteKey ] = resolved;
								if ( !extname(key) ) {
									extensions.reduce( function ( browser, ext ) {
										browser[ absoluteKey + ext ] = browser[ key ];
										return browser;
									}, browser );
								}
							}
							return browser;
						}, {});
					}

					if (options.browser && typeof pkg[ 'browser' ] === 'string') {
						pkg[ 'main' ] = pkg[ 'browser' ];
					} else if ( useModule && pkg[ 'module' ] ) {
						pkg[ 'main' ] = pkg[ 'module' ];
					} else if ( useJsnext && pkg[ 'jsnext:main' ] ) {
						pkg[ 'main' ] = pkg[ 'jsnext:main' ];
					} else if ( ( useJsnext || useModule ) && !useMain ) {
						disregardResult = true;
					}
					return pkg;
				},
				readFile: cachedReadFile,
				isFile: cachedIsFile,
				extensions: extensions
			};

			if (preserveSymlinks !== undefined) {
				resolveOptions.preserveSymlinks = preserveSymlinks;
			}

			return resolveIdAsync(
				importee,
				Object.assign( resolveOptions, customResolveOptions )
			)
				.catch(function () { return false; })
				.then(function (resolved) {
					if (options.browser && packageBrowserField) {
						if (packageBrowserField[ resolved ]) {
							resolved = packageBrowserField[ resolved ];
						}
						browserMapCache[resolved] = packageBrowserField;
					}

					if ( !disregardResult && resolved !== false ) {
						if ( !preserveSymlinks && resolved && fs.existsSync( resolved ) ) {
							resolved = fs.realpathSync( resolved );
						}

						if ( ~builtins.indexOf( resolved ) ) {
							return null;
						} else if ( ~builtins.indexOf( importee ) && preferBuiltins ) {
							if ( !isPreferBuiltinsSet ) {
								onwarn(
									"preferring built-in module '" + importee + "' over local alternative " +
									"at '" + resolved + "', pass 'preferBuiltins: false' to disable this " +
									"behavior or 'preferBuiltins: true' to disable this warning"
								);
							}
							return null;
						} else if ( jail && resolved.indexOf( normalize( jail.trim( sep ) ) ) !== 0 ) {
							return null;
						}
					}

					if ( resolved && options.modulesOnly ) {
						return readFileAsync( resolved, 'utf-8').then(function (code) { return isModule( code ) ? resolved : null; });
					} else {
						return resolved === false ? null : resolved;
					}
				});
		}
	};
}

export default nodeResolve;
