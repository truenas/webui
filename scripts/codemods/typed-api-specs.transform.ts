/**
 * Rewrites a spec from `mockApi()` to `mockTypedApi()`: the mechanical half of moving a spec onto the
 * typed API client (`docs/devs/typed-api-client.md`). The CLI around it is `typed-api-specs.ts`.
 *
 * It handles the shapes that recur across the ~400 legacy specs and reports, by line, everything it
 * left alone, so what remains is a short list to convert by hand rather than a file to re-read:
 *
 * | Legacy                                      | Typed                                                  |
 * |---------------------------------------------|--------------------------------------------------------|
 * | `mockApi([...])`                            | `mockTypedApi([...])`                                  |
 * | `mockCall('x.query', rows)`                 | `mockTypedQuery('x.query', rows)`                      |
 * | `mockCall('x.query')`                       | `mockTypedQuery('x.query', [])`                        |
 * | `mockCall('x', response)`                   | `mockTypedCall('x', response)`                         |
 * | `mockCall('x')`                             | `mockTypedCall('x', null)`                             |
 * | `mockJob('x')`                              | `mockTypedJob('x', { state: JobState.Success })`       |
 * | `mockJob('x', fakeSuccessfulJob(r, a))`     | `mockTypedJob('x', { state: JobState.Success, result: r, ... })` |
 * | `ApiService`, `MockApiService`              | `TypedApiService`, `MockTypedApiService`               |
 * | `<mock>.mockCall('x.query', rows)`          | `<mock>.mockQuery('x.query', rows)`                    |
 * | `expect(api.call)…With('x.query', [f, o])`  | `expect(api.query)…With('x.query', f, o)`             |
 * | ... with `{ get: true }` / `{ count: true }` | `api.queryOne` / `api.queryCount`                     |
 *
 * and the imports that follow from all of it.
 *
 * It does not type-check the result. `mockTypedCall('x', null)` is right for a method that returns
 * nothing and a compile error for one that does, which is the point: the typed fixtures are checked
 * against the API directory, and a fixture that drifted from middleware is exactly what a
 * conversion should surface. Nor can it see timing — the typed double answers on a microtask, so a
 * spec that asserted on a load synchronously now needs `await spectator.fixture.whenStable()`.
 *
 * Methods the component under test still calls on `ApiService` can be kept on the legacy double
 * with `keepLegacy`; the `mockApi([...])` array is then split in two, and `ApiService` references
 * are only renamed where an assertion names a method that moved.
 */
import ts from 'typescript';

export interface TransformOptions {
  /** Methods that stay on `ApiService` / `mockApi`, because the code under test has not moved them yet. */
  keepLegacy?: (method: string) => boolean;
}

export interface TransformNote {
  line: number;
  message: string;
}

export interface TransformResult {
  output: string;
  changed: boolean;
  notes: TransformNote[];
}

interface Edit {
  start: number;
  end: number;
  text: string;
}

const legacyUtilsModule = 'app/core/testing/utils/mock-api.utils';
const typedUtilsModule = 'app/core/testing/utils/mock-typed-api.utils';
const legacyServiceModule = 'app/modules/websocket/api.service';
const typedServiceModule = 'app/modules/websocket/typed-api/typed-api.service';
const legacyMockServiceModule = 'app/core/testing/classes/mock-api.service';
const typedMockServiceModule = 'app/core/testing/classes/mock-typed-api.service';
const jobStateModule = 'app/enums/job-state.enum';
const fakeJobModule = 'app/core/testing/utils/fake-job.utils';

const calledWithMatchers = new Set(['toHaveBeenCalledWith', 'toHaveBeenLastCalledWith', 'toHaveBeenNthCalledWith']);

function isQueryMethod(method: string): boolean {
  return method.endsWith('.query');
}

function isFunctionLike(node: ts.Node): boolean {
  return ts.isArrowFunction(node) || ts.isFunctionExpression(node);
}

/** Applies `edits` (non-overlapping) to `text[start, end)`. */
function applyEdits(text: string, edits: Edit[], start = 0, end = text.length): string {
  let result = '';
  let cursor = start;
  [...edits]
    .filter((edit) => edit.start >= start && edit.end <= end)
    // Same start: an insertion before the replacement that begins there.
    .sort((a, b) => a.start - b.start || a.end - b.end)
    .forEach((edit) => {
      result += text.slice(cursor, edit.start) + edit.text;
      cursor = edit.end;
    });
  return result + text.slice(cursor, end);
}

function lineIndentAt(text: string, pos: number): string {
  const lineStart = text.lastIndexOf('\n', pos - 1) + 1;
  return /^[ \t]*/.exec(text.slice(lineStart))?.[0] ?? '';
}

class SpecTransformer {
  private edits: Edit[] = [];
  readonly notes: TransformNote[] = [];
  private readonly keepLegacy: (method: string) => boolean;
  /**
   * Whether a call or job moved to the typed double. Only then can a submit be waiting on the typed
   * double's microtask; a spec that moved only its queries still saves through the legacy one.
   */
  private movedMutation = false;
  /** Anything this pass left on the legacy double, deliberately or not. */
  private keepsLegacy = false;
  private importedNames = new Map<string, string>();
  /** The `x` of each `expect(x.call).toHaveBeenCalledWith(<moved method>, ...)`. */
  private inspected: ts.Expression[] = [];
  /** Test callbacks `settleAfter` has already made async. */
  private madeAsync = new Set<ts.Node>();
  /** The same, for methods kept on the legacy client: their `ApiService` is meant. */
  private inspectedLegacy: ts.Expression[] = [];

  constructor(private sourceFile: ts.SourceFile, options: TransformOptions) {
    this.keepLegacy = options.keepLegacy ?? (() => false);
    this.collectImports();
  }

  run(): string {
    const { text } = this.sourceFile;
    this.visit(this.sourceFile);
    if (this.keepsLegacy) {
      this.inspected.forEach((expression) => this.renameInspectedService(expression));
    }
    this.renameServiceReferences();
    if (this.movedMutation) {
      this.settleAfterSubmits(this.sourceFile);
    }
    this.reportLeftovers(this.sourceFile);
    return applyEdits(text, this.edits);
  }

  private note(node: ts.Node, message: string): void {
    const { line } = this.sourceFile.getLineAndCharacterOfPosition(node.getStart(this.sourceFile));
    this.notes.push({ line: line + 1, message });
  }

  private collectImports(): void {
    this.sourceFile.statements.filter(ts.isImportDeclaration).forEach((declaration) => {
      const module = (declaration.moduleSpecifier as ts.StringLiteral).text;
      const bindings = declaration.importClause?.namedBindings;
      if (bindings && ts.isNamedImports(bindings)) {
        bindings.elements.forEach((element) => this.importedNames.set(element.name.text, module));
      }
    });
  }

  private isImportedFrom(name: string, module: string): boolean {
    return this.importedNames.get(name) === module;
  }

  private text(node: ts.Node): string {
    return node.getText(this.sourceFile);
  }

  private replace(node: ts.Node, text: string): void {
    const start = node.getStart(this.sourceFile);
    if (this.edits.some((edit) => edit.start === start && edit.end === node.getEnd())) {
      return; // Reached twice, e.g. the same `inject(ApiService)` under two assertions.
    }
    this.edits.push({ start, end: node.getEnd(), text });
  }

  private visit(node: ts.Node): void {
    if (ts.isCallExpression(node)) {
      if (ts.isIdentifier(node.expression)) {
        const name = node.expression.text;
        if (name === 'mockApi' && this.isImportedFrom(name, legacyUtilsModule)) {
          this.visitMockApi(node);
          return;
        }
        if (name === 'mockCall' && this.isImportedFrom(name, legacyUtilsModule)) {
          this.convertMockCall(node);
        } else if (name === 'mockJob' && this.isImportedFrom(name, legacyUtilsModule)) {
          this.convertMockJob(node);
        }
      } else if (ts.isPropertyAccessExpression(node.expression)) {
        this.visitMethodCall(node, node.expression);
      }
    }
    ts.forEachChild(node, (child) => this.visit(child));
  }

  private methodOf(call: ts.CallExpression): string | null {
    const [first] = call.arguments;
    return first && ts.isStringLiteralLike(first) ? first.text : null;
  }

  /**
   * `mockCall(...)` → `mockTypedCall` / `mockTypedQuery`. Returns whether it converted, so
   * `mockApi` knows which half of its array the element belongs to.
   */
  private convertMockCall(call: ts.CallExpression): boolean {
    const method = this.methodOf(call);
    if (method === null) {
      this.note(call, '`mockCall` with a non-literal method; convert by hand.');
      this.keepsLegacy = true;
      return false;
    }
    if (this.keepLegacy(method)) {
      this.keepsLegacy = true;
      return false;
    }
    const response = call.arguments[1];
    if (isQueryMethod(method)) {
      if (response && isFunctionLike(response)) {
        this.note(call, `\`mockCall('${method}', factory)\`: \`mockTypedQuery\` takes rows, not a factory; convert by hand.`);
        this.keepsLegacy = true;
        return false;
      }
      this.replace(call.expression, 'mockTypedQuery');
      if (!response) {
        this.edits.push({ start: call.arguments[0].getEnd(), end: call.arguments[0].getEnd(), text: ', []' });
      }
      return true;
    }
    this.movedMutation = true;
    this.replace(call.expression, 'mockTypedCall');
    if (!response) {
      this.edits.push({ start: call.arguments[0].getEnd(), end: call.arguments[0].getEnd(), text: ', null' });
    }
    return true;
  }

  private convertMockJob(call: ts.CallExpression): boolean {
    const method = this.methodOf(call);
    if (method === null) {
      this.note(call, '`mockJob` with a non-literal method; convert by hand.');
      this.keepsLegacy = true;
      return false;
    }
    if (this.keepLegacy(method)) {
      this.keepsLegacy = true;
      return false;
    }
    const update = this.jobUpdateFor(call.arguments[1]);
    if (update === null) {
      this.note(call, `\`mockJob('${method}', ...)\`: only \`fakeSuccessfulJob()\` responses convert; `
      + 'script the typed job as `JobUpdate`s by hand.');
      this.keepsLegacy = true;
      return false;
    }
    this.movedMutation = true;
    this.replace(call.expression, 'mockTypedJob');
    if (call.arguments[1]) {
      this.replace(call.arguments[1], update);
    } else {
      this.edits.push({ start: call.arguments[0].getEnd(), end: call.arguments[0].getEnd(), text: `, ${update}` });
    }
    return true;
  }

  /** The `JobUpdate` for a legacy job response, or null for a shape only a person can translate. */
  private jobUpdateFor(response: ts.Expression | undefined): string | null {
    if (!response) {
      return '{ state: JobState.Success }';
    }
    if (
      !ts.isCallExpression(response)
      || !ts.isIdentifier(response.expression)
      || response.expression.text !== 'fakeSuccessfulJob'
    ) {
      return null;
    }
    const [result, jobArguments] = response.arguments;
    const fields = ['state: JobState.Success'];
    if (result && this.text(result) !== 'undefined') {
      fields.push(`result: ${this.text(result)}`);
    }
    if (jobArguments && this.text(jobArguments) !== 'undefined') {
      fields.push(`arguments: ${this.text(jobArguments)}`);
    }
    return `{ ${fields.join(', ')} }`;
  }

  /**
   * `mockApi([...])` becomes `mockTypedApi([...])` when every element converts, and is split in two
   * when some stay behind — kept on purpose, or a shape this does not handle.
   */
  private visitMockApi(call: ts.CallExpression): void {
    const [list] = call.arguments;
    if (!list) {
      this.replace(call.expression, 'mockTypedApi');
      return;
    }
    if (!ts.isArrayLiteralExpression(list)) {
      this.note(call, '`mockApi()` with a non-literal list; convert by hand.');
      this.keepsLegacy = true;
      return;
    }

    const typed: ts.Expression[] = [];
    const legacy: ts.Expression[] = [];
    list.elements.forEach((element) => {
      if (this.convertElement(element)) {
        typed.push(element);
      } else {
        legacy.push(element);
      }
    });

    if (!legacy.length) {
      this.replace(call.expression, 'mockTypedApi');
      return;
    }
    if (!typed.length) {
      return;
    }

    // A split: render each element with the edits already made inside it, then replace the whole
    // call with the two arrays. The inner edits are folded into that replacement.
    const { text } = this.sourceFile;
    const start = call.getStart(this.sourceFile);
    const end = call.getEnd();
    const render = (element: ts.Expression): string => {
      return applyEdits(text, this.edits, element.getStart(this.sourceFile), element.getEnd());
    };
    const outer = lineIndentAt(text, start);
    const inner = lineIndentAt(text, list.elements[0].getStart(this.sourceFile));
    const array = (elements: ts.Expression[]): string => {
      const items = elements.map((element) => `${inner}${render(element)},`);
      return `[\n${items.join('\n')}\n${outer}]`;
    };
    const split = `mockTypedApi(${array(typed)}),\n${outer}mockApi(${array(legacy)})`;
    this.edits = this.edits.filter((edit) => edit.start < start || edit.end > end);
    this.edits.push({ start, end, text: split });
  }

  private convertElement(element: ts.Expression): boolean {
    if (ts.isCallExpression(element) && ts.isIdentifier(element.expression)) {
      const name = element.expression.text;
      if (name === 'mockCall' && this.isImportedFrom(name, legacyUtilsModule)) {
        return this.convertMockCall(element);
      }
      if (name === 'mockJob' && this.isImportedFrom(name, legacyUtilsModule)) {
        return this.convertMockJob(element);
      }
    }
    this.note(element, `\`mockApi\` element \`${this.text(element).slice(0, 60)}\` is not a \`mockCall\`/\`mockJob\`; `
    + 'left on the legacy double.');
    this.keepsLegacy = true;
    return false;
  }

  /** `<mock>.mockCall(...)`, `<mock>.mockJob(...)` and `expect(<api>.call).toHaveBeenCalledWith(...)`. */
  private visitMethodCall(call: ts.CallExpression, callee: ts.PropertyAccessExpression): void {
    const name = callee.name.text;
    if (name === 'mockCall' || name === 'mockJob') {
      this.convertServiceMock(call, callee);
    } else if (calledWithMatchers.has(name)) {
      this.convertAssertion(call, callee);
    }
  }

  private convertServiceMock(call: ts.CallExpression, callee: ts.PropertyAccessExpression): void {
    const method = this.methodOf(call);
    if (method === null || this.keepLegacy(method)) {
      return;
    }
    if (callee.name.text === 'mockJob') {
      const update = this.jobUpdateFor(call.arguments[1]);
      if (update === null) {
        this.note(call, `\`.mockJob('${method}', ...)\`: only \`fakeSuccessfulJob()\` responses convert; convert by hand.`);
        this.keepsLegacy = true;
        return;
      }
      this.movedMutation = true;
      if (call.arguments[1]) {
        this.replace(call.arguments[1], update);
      } else {
        this.edits.push({ start: call.arguments[0].getEnd(), end: call.arguments[0].getEnd(), text: `, ${update}` });
      }
      return;
    }

    const response = call.arguments[1];
    if (isQueryMethod(method)) {
      if (response && isFunctionLike(response)) {
        this.note(call, `\`.mockCall('${method}', factory)\`: \`mockQuery\` takes rows, not a factory; convert by hand.`);
        this.keepsLegacy = true;
        return;
      }
      this.replace(callee.name, 'mockQuery');
      if (!response) {
        this.edits.push({ start: call.arguments[0].getEnd(), end: call.arguments[0].getEnd(), text: ', []' });
      }
    } else {
      this.movedMutation = true;
      if (!response) {
        this.edits.push({ start: call.arguments[0].getEnd(), end: call.arguments[0].getEnd(), text: ', null' });
      }
    }
  }

  /**
   * `expect(<api>.<verb>).toHaveBeenCalledWith('x', ...)`: remembers `<api>` so a split spec can point
   * it at the typed double, and moves a `.query` method from `call` to the query verb the component
   * now uses, with the params array unpacked into arguments.
   */
  private convertAssertion(call: ts.CallExpression, matcher: ts.PropertyAccessExpression): void {
    const isNth = matcher.name.text === 'toHaveBeenNthCalledWith';
    const methodArg = call.arguments[isNth ? 1 : 0];
    if (!methodArg || !ts.isStringLiteralLike(methodArg)) {
      return;
    }
    const method = methodArg.text;

    // Walk `expect(x.call).not.toHaveBeenCalledWith` back to `expect(x.call)`.
    let receiver: ts.Expression = matcher.expression;
    if (ts.isPropertyAccessExpression(receiver) && receiver.name.text === 'not') {
      receiver = receiver.expression;
    }
    if (
      !ts.isCallExpression(receiver)
      || !ts.isIdentifier(receiver.expression)
      || receiver.expression.text !== 'expect'
    ) {
      return;
    }
    const spied = receiver.arguments[0];
    if (!spied || !ts.isPropertyAccessExpression(spied)) {
      return;
    }
    if (this.keepLegacy(method)) {
      this.inspectedLegacy.push(spied.expression);
      return;
    }
    this.inspected.push(spied.expression);
    if (spied.name.text !== 'call' || !isQueryMethod(method)) {
      return;
    }

    const params = call.arguments[isNth ? 2 : 1];
    const verbAndArgs = this.queryVerbFor(params);
    if (verbAndArgs === null) {
      this.note(call, `Assertion on \`call('${method}', ...)\` with params \`${this.text(params).slice(0, 50)}\`: `
      + 'move it to `query` / `queryOne` / `queryCount` by hand.');
      return;
    }
    const [verb, args] = verbAndArgs;
    this.replace(spied.name, verb);
    if (params && args.length) {
      this.replace(params, args.join(', '));
    } else if (params) {
      // From the end of the method literal, so the comma before the params goes as well.
      this.edits.push({ start: methodArg.getEnd(), end: params.getEnd(), text: '' });
    }
  }

  /**
   * `[filters, options]` → the verb and its arguments, or null for params that are not a literal
   * array. Filters are kept as written, `[]` included: whether the component now passes `[]` or
   * nothing is its business, and the assertion should say the same as before.
   */
  private queryVerbFor(params: ts.Expression | undefined): [string, string[]] | null {
    if (!params) {
      return ['query', []];
    }
    if (!ts.isArrayLiteralExpression(params)) {
      return null;
    }
    const [filters, options, ...rest] = params.elements;
    // Filters are an array or a name for one; anything else (`audit.query`'s single object, a
    // spread) is a params shape of its own.
    if (rest.length || (filters && !ts.isArrayLiteralExpression(filters) && !ts.isIdentifier(filters))) {
      return null;
    }
    const args = filters ? [this.text(filters)] : [];
    if (!options) {
      return ['query', args];
    }
    if (!ts.isObjectLiteralExpression(options)) {
      return null;
    }
    const nameOf = (property: ts.ObjectLiteralElementLike): string => {
      return property.name && ts.isIdentifier(property.name) ? property.name.text : '';
    };
    // A spread, computed or quoted key has no name to match on; a person moves those.
    if (options.properties.some((property) => !property.name || !ts.isIdentifier(property.name))) {
      return null;
    }
    const isTrue = (property: ts.ObjectLiteralElementLike): boolean => {
      return ts.isPropertyAssignment(property) && property.initializer.kind === ts.SyntaxKind.TrueKeyword;
    };
    const flag = (name: string): boolean => {
      return options.properties.some((property) => nameOf(property) === name && isTrue(property));
    };
    let verb = 'query';
    if (flag('count')) {
      verb = 'queryCount';
    } else if (flag('get')) {
      verb = 'queryOne';
    }
    const dropped = ({ queryCount: 'count', queryOne: 'get' } as Record<string, string>)[verb] ?? '';
    const kept = options.properties.filter((property) => nameOf(property) !== dropped);
    if (verb === 'queryCount' && kept.length) {
      return null; // `queryCount` takes filters only.
    }
    if (kept.length) {
      args.push(this.withoutProperty(options, options.properties.find((property) => nameOf(property) === dropped)));
    }
    return [verb, args];
  }

  /** An object literal's text as written, less one property and its comma. */
  private withoutProperty(
    object: ts.ObjectLiteralExpression,
    property: ts.ObjectLiteralElementLike | undefined,
  ): string {
    const text = this.text(object);
    if (!property) {
      return text;
    }
    const base = object.getStart(this.sourceFile);
    const { properties } = object;
    const index = properties.indexOf(property);
    const next = properties[index + 1];
    // Up to the next property, or back to the end of the previous one when it is the last.
    const start = next || index === 0 ? property.getStart(this.sourceFile) : properties[index - 1].getEnd();
    const end = next ? next.getStart(this.sourceFile) : property.getEnd();
    return text.slice(0, start - base) + text.slice(end - base);
  }

  /** In a split spec, the assertion's `inject(ApiService)` moves with the method it asserts on. */
  private renameInspectedService(expression: ts.Expression): void {
    const find = (node: ts.Node): void => {
      if (ts.isIdentifier(node) && (node.text === 'ApiService' || node.text === 'MockApiService')) {
        this.replace(node, node.text === 'ApiService' ? 'TypedApiService' : 'MockTypedApiService');
      }
      ts.forEachChild(node, find);
    };
    find(expression);
  }

  /**
   * `ApiService` → `TypedApiService` and `MockApiService` → `MockTypedApiService`, everywhere
   * outside the imports — unless the spec keeps the legacy double, where a bare reference could
   * mean either and is left for a person.
   */
  private renameServiceReferences(): void {
    const renames: Record<string, [string, string]> = {
      ApiService: ['TypedApiService', legacyServiceModule],
      MockApiService: ['MockTypedApiService', legacyMockServiceModule],
    };
    const claimed = new Set(this.edits.map((edit) => edit.start));
    const isKeptOnLegacy = (node: ts.Node): boolean => this.inspectedLegacy.some((expression) => {
      return node.getStart(this.sourceFile) >= expression.getStart(this.sourceFile)
        && node.getEnd() <= expression.getEnd();
    });
    let ambiguous: ts.Node | null = null;
    const visit = (node: ts.Node): void => {
      if (ts.isImportDeclaration(node)) {
        return;
      }
      if (ts.isIdentifier(node) && renames[node.text] && this.isImportedFrom(node.text, renames[node.text][1])) {
        if (isReference(node) && !claimed.has(node.getStart(this.sourceFile))) {
          if (this.keepsLegacy) {
            if (!isKeptOnLegacy(node)) {
              ambiguous ??= node;
            }
          } else {
            this.replace(node, renames[node.text][0]);
          }
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(this.sourceFile);
    if (ambiguous) {
      this.note(ambiguous, 'Spec keeps legacy mocks, so `ApiService` / `MockApiService` references were not renamed; '
      + 'point each at the service the method now lives on.');
    }
  }

  /**
   * The typed double answers on a microtask, as a socket would, so a spec that asserts on the outcome
   * of `spectator.component.submit()` has to let it land first. Adds
   * `await spectator.fixture.whenStable()` after each such submit, and makes the test async to hold
   * it. A submit inside some other function is reported instead: making a helper async changes what
   * it returns.
   */
  private settleAfterSubmits(root: ts.Node): void {
    const visit = (node: ts.Node): void => {
      const target = ts.isExpressionStatement(node) ? submittedSpectator(node) : null;
      if (target) {
        this.settleAfter(node as ts.ExpressionStatement, target);
      }
      ts.forEachChild(node, visit);
    };
    visit(root);
  }

  private settleAfter(statement: ts.ExpressionStatement, spectator: string): void {
    const settle = `await ${spectator}.fixture.whenStable();`;
    const block = statement.parent;
    if (ts.isBlock(block)) {
      const next = block.statements[block.statements.indexOf(statement) + 1];
      if (next && this.text(next).includes('whenStable()')) {
        return;
      }
    }
    const fn = ts.findAncestor(statement, (node): node is ts.ArrowFunction | ts.FunctionExpression => {
      return ts.isArrowFunction(node) || ts.isFunctionExpression(node) || ts.isFunctionDeclaration(node)
        || ts.isMethodDeclaration(node);
    });
    if (!fn || !(ts.isArrowFunction(fn) || ts.isFunctionExpression(fn))) {
      this.note(statement, `\`${this.text(statement)}\` outside a test callback: the typed double answers on a `
      + `microtask, so callers need \`${settle}\` before asserting on the result.`);
      return;
    }
    const isAsync = fn.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword);
    if (!isAsync) {
      const isTestCallback = ts.isCallExpression(fn.parent) && ts.isIdentifier(fn.parent.expression)
        && ['it', 'test', 'beforeEach'].includes(fn.parent.expression.text);
      if (!isTestCallback) {
        this.note(statement, `\`${this.text(statement)}\` in a synchronous helper: the typed double answers on a `
        + `microtask, so callers need \`${settle}\` before asserting on the result.`);
        return;
      }
      // Once per callback, however many submits it holds: `isAsync` reads the untouched AST.
      if (!this.madeAsync.has(fn)) {
        this.madeAsync.add(fn);
        this.edits.push({ start: fn.getStart(this.sourceFile), end: fn.getStart(this.sourceFile), text: 'async ' });
      }
    }
    const indent = lineIndentAt(this.sourceFile.text, statement.getStart(this.sourceFile));
    this.edits.push({ start: statement.getEnd(), end: statement.getEnd(), text: `\n${indent}${settle}` });
  }

  /** Shapes that need a person, found after the rewrite so they are reported once. */
  private reportLeftovers(root: ts.Node): void {
    const visit = (node: ts.Node): void => {
      if (ts.isCallExpression(node)) {
        const callee = node.expression;
        const [first, second] = node.arguments;
        if (ts.isIdentifier(callee) && callee.text === 'mockProvider' && first && ts.isIdentifier(first)
          && (first.text === 'ApiService' || first.text === 'TypedApiService') && second) {
          this.note(node, '`mockProvider(ApiService, {...})`: query methods move from `call` to '
          + '`query` / `queryOne` / `queryCount`; check the stubs.');
        }
        if (ts.isIdentifier(callee) && callee.text === 'failApiCall') {
          this.note(node, '`failApiCall()` drives the legacy double; use `mockTypedCallError()` instead.');
        }
        if (ts.isPropertyAccessExpression(callee) && callee.name.text === 'callAndSubscribe') {
          this.note(node, '`callAndSubscribe()` has no typed counterpart; the code under test reads `call` and '
          + '`subscribe` separately now.');
        }
        if (ts.isStringLiteralLike(node.arguments[1] ?? node) && node.arguments[1]
          && (node.arguments[1] as ts.StringLiteral).text === 'callAndSubscribe') {
          this.note(node, '`callAndSubscribe` stub has no typed counterpart; stub `call` and `subscribe` instead.');
        }
        if (ts.isPropertyAccessExpression(callee) && callee.name.text === 'mockCallOnce') {
          this.note(node, '`mockCallOnce()` is the legacy double\'s; script the answer with `mockCall` on the typed double '
          + 'and re-script it where the test needs the next one.');
        }
        if (ts.isPropertyAccessExpression(callee) && callee.name.text === 'emitSubscribeEvent') {
          this.note(node, '`emitSubscribeEvent()` is the legacy double\'s; the typed one is `emitEvent(event, change)`.');
        }
      }
      if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken
        && [node.left, node.right].some((side) => ts.isStringLiteralLike(side) && isQueryMethod(side.text))) {
        this.note(node, `Hand-written dispatch on \`${this.text(node).slice(0, 60)}\`: the typed client queries `
        + 'through `query` / `queryOne` / `queryCount`, not `call`.');
      }
      if (ts.isCaseClause(node) && ts.isStringLiteralLike(node.expression) && isQueryMethod(node.expression.text)) {
        this.note(node, `Hand-written dispatch on \`'${node.expression.text}'\`: the typed client queries `
        + 'through `query` / `queryOne` / `queryCount`, not `call`.');
      }
      ts.forEachChild(node, visit);
    };
    visit(root);
  }
}

/** `spectator` for a `spectator.component.submit();` statement, else null. */
function submittedSpectator(statement: ts.ExpressionStatement): string | null {
  const call = statement.expression;
  if (!ts.isCallExpression(call) || call.arguments.length || !ts.isPropertyAccessExpression(call.expression)) {
    return null;
  }
  const submit = call.expression;
  const component = submit.expression;
  if (
    submit.name.text !== 'submit'
    || !ts.isPropertyAccessExpression(component)
    || component.name.text !== 'component'
    || !ts.isIdentifier(component.expression)
  ) {
    return null;
  }
  return component.expression.text;
}

/** Whether an identifier names a binding, rather than a member: `mock.mockCall` does not use `mockCall`. */
function isReference(node: ts.Identifier): boolean {
  const { parent } = node;
  if (ts.isPropertyAccessExpression(parent) && parent.name === node) {
    return false;
  }
  return !((ts.isPropertyAssignment(parent) || ts.isMethodDeclaration(parent) || ts.isPropertyDeclaration(parent)
    || ts.isPropertySignature(parent) || ts.isMethodSignature(parent)) && parent.name === node);
}

/** Rewrites the import block of already-transformed source to match what it now references. */
function fixImports(source: string, fileName: string): string {
  const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const used = new Set<string>();
  const collect = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node)) {
      return;
    }
    if (ts.isIdentifier(node) && isReference(node)) {
      used.add(node.text);
    }
    ts.forEachChild(node, collect);
  };
  collect(sourceFile);

  const imports = sourceFile.statements.filter(ts.isImportDeclaration);
  const wanted = new Map<string, Set<string>>();
  const want = (module: string, name: string): void => {
    if (!wanted.has(module)) {
      wanted.set(module, new Set());
    }
    wanted.get(module).add(name);
  };

  // Names this codemod is responsible for, and where each lives.
  const managed: Record<string, string> = {
    mockApi: legacyUtilsModule,
    mockCall: legacyUtilsModule,
    mockJob: legacyUtilsModule,
    mockTypedApi: typedUtilsModule,
    mockTypedCall: typedUtilsModule,
    mockTypedQuery: typedUtilsModule,
    mockTypedJob: typedUtilsModule,
    ApiService: legacyServiceModule,
    TypedApiService: typedServiceModule,
    MockApiService: legacyMockServiceModule,
    MockTypedApiService: typedMockServiceModule,
    JobState: jobStateModule,
    fakeSuccessfulJob: fakeJobModule,
  };
  const imported = new Set<string>();
  imports.forEach((declaration) => {
    const bindings = declaration.importClause?.namedBindings;
    if (bindings && ts.isNamedImports(bindings)) {
      bindings.elements.forEach((element) => imported.add(element.name.text));
    }
  });
  Object.entries(managed).forEach(([name, module]) => {
    if (used.has(name) && !imported.has(name)) {
      want(module, name);
    }
  });

  const edits: Edit[] = [];
  const managedModules = new Set(Object.values(managed));
  imports.forEach((declaration) => {
    const module = (declaration.moduleSpecifier as ts.StringLiteral).text;
    const bindings = declaration.importClause?.namedBindings;
    if (!managedModules.has(module) || !bindings || !ts.isNamedImports(bindings) || declaration.importClause.name) {
      return;
    }
    const names = bindings.elements
      .map((element) => element.getText(sourceFile))
      .filter((specifier, index) => {
        const name = bindings.elements[index].name.text;
        return managed[name] !== module || used.has(name);
      });
    const added = [...(wanted.get(module) ?? [])];
    wanted.delete(module);
    const all = [...names, ...sortNames(added)];
    const start = declaration.getStart(sourceFile);
    if (!all.length) {
      // Drop the line, newline included.
      const lineEnd = source.indexOf('\n', declaration.getEnd());
      if (lineEnd === -1) {
        // The file's last line: take the newline before it instead.
        const previous = source.lastIndexOf('\n', start);
        edits.push({ start: Math.max(previous, 0), end: source.length, text: '' });
      } else {
        edits.push({ start, end: lineEnd + 1, text: '' });
      }
    } else if (added.length || all.length !== bindings.elements.length) {
      edits.push({ start, end: declaration.getEnd(), text: importLine(module, all) });
    }
  });

  // Modules with nothing to merge into: insert in path order among the `app/` imports.
  [...wanted.entries()].forEach(([module, names]) => {
    const line = importLine(module, sortNames([...names]));
    const after = imports.find((declaration) => {
      const other = (declaration.moduleSpecifier as ts.StringLiteral).text;
      return other.startsWith('app/') && other.localeCompare(module) > 0;
    });
    // At the start of a line either way, so it cannot land inside an import being dropped; and ahead
    // of any relative import, which `import/order` puts last.
    const relative = imports.find((declaration) => (declaration.moduleSpecifier as ts.StringLiteral).text.startsWith('.'));
    const last = imports[imports.length - 1];
    let position = 0;
    let text = `${line}\n`;
    if (after ?? relative) {
      position = (after ?? relative).getStart(sourceFile);
    } else if (last) {
      const lineEnd = source.indexOf('\n', last.getEnd());
      // The last import can be the file's last line, with no newline to start after.
      position = lineEnd === -1 ? source.length : lineEnd + 1;
      text = lineEnd === -1 ? `\n${line}\n` : text;
    }
    edits.push({ start: position, end: position, text });
  });

  return applyEdits(source, edits);
}

function sortNames(names: string[]): string[] {
  const sorted = [...names];
  sorted.sort((a, b) => a.localeCompare(b, 'en'));
  return sorted;
}

function importLine(module: string, names: string[]): string {
  const single = `import { ${names.join(', ')} } from '${module}';`;
  if (single.length <= 120) {
    return single;
  }
  return `import {\n  ${names.join(', ')},\n} from '${module}';`;
}

export function transformSpec(source: string, fileName: string, options: TransformOptions = {}): TransformResult {
  const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const transformer = new SpecTransformer(sourceFile, options);
  const rewritten = transformer.run();
  const output = rewritten === source ? source : fixImports(rewritten, fileName);
  const notes = [...transformer.notes];
  notes.sort((a, b) => a.line - b.line);
  return { output, changed: output !== source, notes };
}
