/**
 * The middleware methods and events the UI's source names at a call site — the inventory half of
 * `scripts/e2e-coverage.ts`, kept in its own module so it can be tested without running the report.
 *
 * Read off the TypeScript AST, with the type checker resolving each call's first argument. That one
 * rule covers a literal (`call('a.b')`), a `const` holding a conditional of literals
 * (`snapshot-details-row`'s hold/release) and a parameter typed as a literal union
 * (`getAppsFetchCall(endPoint: 'app.available' | 'app.latest')`, `alert.effects`'
 * `'alert.dismiss' | 'alert.restore'`). Comments are trivia, not nodes, so a JSDoc example never
 * counts, and a type annotation is not a property assignment, so neither does a parameter typed
 * `method: '…'`. A name built at runtime has type `string` and is skipped, and so is anything typed
 * more loosely than the call site spells it (see {@link namedAtCallSite}).
 */

import { readdirSync, statSync } from 'fs';
import { dirname, join } from 'path';
import * as ts from 'typescript';

export interface ApiInventory {
  methods: Set<string>;
  events: Set<string>;
}

/** Not features: the plumbing `e2e/support/coverage.ts` also ignores. */
export const ignoredMethods = new Set(['core.ping', 'core.subscribe', 'core.unsubscribe', 'core.set_options']);

/** `ApiService` and `TypedApiService` share these names; the first argument is the method. */
const callNames = new Set([
  'call', 'callUnauthenticated', 'job', 'startJob', 'callAndSubscribe', 'queryAndSubscribe', 'query',
]);

const methodName = /^[a-z][a-z0-9_]*(?:\.[a-z0-9_]+)+$/;

function sourceFiles(dir: string, skip: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      return path === skip ? [] : sourceFiles(path, skip);
    }
    return name.endsWith('.ts') && !name.endsWith('.spec.ts') ? [path] : [];
  });
}

/** The compiler options of a `tsconfig.json`, so `app/*` imports resolve as they do in the build. */
export function compilerOptionsFrom(tsconfigPath: string): ts.CompilerOptions {
  const { config } = ts.readConfigFile(tsconfigPath, (path) => ts.sys.readFile(path));
  return ts.parseJsonConfigFileContent(config, ts.sys, dirname(tsconfigPath)).options;
}

function isLiteralUnionNode(type: ts.TypeNode): boolean {
  return ts.isLiteralTypeNode(type) || (ts.isUnionTypeNode(type) && type.types.every(ts.isLiteralTypeNode));
}

/**
 * Whether the source spells the name out: a literal, a conditional whose branches all are, a
 * `const` with no annotation whose initializer is, or a parameter whose annotation is itself a
 * literal union. Without this the checker also resolves the API layer's own plumbing —
 * `ApiService.subscribe(method)`, `TypedApiService.query(...args)` and the table data providers'
 * `this.method` are typed with method-union aliases, and would bring in 80-odd names that no
 * feature calls. It is checked all the way down, so `const method = this.method` does not let
 * them back in.
 */
function namedAtCallSite(node: ts.Expression, checker: ts.TypeChecker): boolean {
  if (ts.isStringLiteralLike(node)) {
    return true;
  }
  if (ts.isParenthesizedExpression(node)) {
    return namedAtCallSite(node.expression, checker);
  }
  if (ts.isConditionalExpression(node)) {
    return namedAtCallSite(node.whenTrue, checker) && namedAtCallSite(node.whenFalse, checker);
  }
  if (!ts.isIdentifier(node)) {
    return false;
  }
  const declaration = checker.getSymbolAtLocation(node)?.valueDeclaration;
  if (declaration && ts.isVariableDeclaration(declaration)) {
    return !declaration.type && declaration.initializer !== undefined
      && (ts.getCombinedNodeFlags(declaration) & ts.NodeFlags.Const) !== 0
      && namedAtCallSite(declaration.initializer, checker);
  }
  if (declaration && ts.isParameter(declaration)) {
    return declaration.type !== undefined && isLiteralUnionNode(declaration.type);
  }
  return false;
}

/**
 * Every string literal the expression's type can be, where {@link namedAtCallSite} allows it. Only
 * literal members count: a plain `string` is a name built at runtime.
 */
function literalValues(node: ts.Expression | undefined, checker: ts.TypeChecker): string[] {
  if (!node || !namedAtCallSite(node, checker)) {
    return [];
  }
  const type = checker.getTypeAtLocation(node);
  return (type.isUnion() ? type.types : [type])
    .filter((member): member is ts.StringLiteralType => member.isStringLiteral())
    .map((member) => member.value);
}

/**
 * `method: '…'`, or a conditional of them, read syntactically. The download and upload helpers pass
 * the method this way. The checker is not used here: `method: message.method` in the websocket debug
 * panel's mock responses is typed as the whole method union, which is not a call site.
 */
function syntacticLiterals(node: ts.Expression): string[] {
  if (ts.isStringLiteralLike(node)) {
    return [node.text];
  }
  if (ts.isParenthesizedExpression(node)) {
    return syntacticLiterals(node.expression);
  }
  if (ts.isConditionalExpression(node)) {
    return [...syntacticLiterals(node.whenTrue), ...syntacticLiterals(node.whenFalse)];
  }
  return [];
}

function propertyName(name: ts.PropertyName): string | undefined {
  return ts.isIdentifier(name) || ts.isStringLiteral(name) ? name.text : undefined;
}

/**
 * Scans every non-spec `.ts` file under `rootDir`, skipping `<rootDir>/core/testing`.
 * `compilerOptions` should be the project's, or imported types will not resolve.
 */
export function scanApiUsage(rootDir: string, compilerOptions: ts.CompilerOptions = {}): ApiInventory {
  const files = sourceFiles(rootDir, join(rootDir, 'core/testing'));
  const program = ts.createProgram(files, { ...compilerOptions, noEmit: true });
  const checker = program.getTypeChecker();
  const methods = new Set<string>();
  const events = new Set<string>();

  const addMethods = (names: string[]): void => {
    for (const name of names) {
      if (methodName.test(name) && !ignoredMethods.has(name)) {
        methods.add(name);
      }
    }
  };

  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const callee = node.expression.name.text;
      const [first, second] = node.arguments;
      if (callNames.has(callee)) {
        const names = literalValues(first, checker);
        addMethods(names);
        // `core.bulk` fans out the method named first in its second argument.
        if (names.includes('core.bulk') && second && ts.isArrayLiteralExpression(second)) {
          addMethods(literalValues(second.elements[0], checker));
        }
      }
      // RxJS's `subscribe` never takes a string, so a string literal here is always an event.
      if (callee === 'subscribe') {
        for (const name of literalValues(first, checker)) {
          if (methodName.test(name)) {
            events.add(name);
          }
        }
      }
    }
    if (ts.isPropertyAssignment(node) && propertyName(node.name) === 'method') {
      addMethods(syntacticLiterals(node.initializer));
    }
    ts.forEachChild(node, visit);
  };

  for (const file of files) {
    const source = program.getSourceFile(file);
    if (source) {
      visit(source);
    }
  }
  return { methods, events };
}
