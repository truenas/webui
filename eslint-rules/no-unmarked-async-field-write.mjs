/**
 * The app runs zoneless, so nothing re-renders just because a callback fired. A component that
 * writes a plain field from an async callback (a `subscribe`, a timer, a promise, a DOM listener)
 * must either make that field a signal or call `markForCheck()`; otherwise the template keeps
 * showing the old value until something unrelated happens to trigger change detection.
 *
 * What this checks: inside a `@Component` class, an assignment to `this.<field>` where
 * - `<field>` is declared in the same class and is not `private` (the repo convention is that
 *   `private` members are never read by the template; `protected`/public ones may be),
 * - the assignment sits inside a callback passed to one of the async APIs below,
 * - and that callback never calls `markForCheck()` or `detectChanges()`.
 *
 * A `markForCheck()` (or signal write) reached through a method of the same class the callback
 * calls (`this.handleError(error)`) counts too.
 *
 * What it does not check: whether the template really reads the field, fields inherited from a
 * base class, writes made inside a helper method the callback calls, and re-renders reached
 * through another service or class. Those stay convention (see "Zoneless" in CLAUDE.md).
 */

const asyncMethodNames = new Set([
  'subscribe',
  'then',
  'catch',
  'finally',
  'addEventListener',
]);

const asyncFunctionNames = new Set([
  'setTimeout',
  'setInterval',
  'requestAnimationFrame',
  'queueMicrotask',
]);

const rerenderCalls = new Set(['markForCheck', 'detectChanges']);
const signalWriteCalls = new Set(['set', 'update']);

function calleeName(callee) {
  if (callee.type === 'Identifier') return callee.name;
  if (callee.type === 'MemberExpression' && !callee.computed && callee.property.type === 'Identifier') {
    return callee.property.name;
  }
  return null;
}

function isAsyncCall(call) {
  const { callee } = call;
  if (callee.type === 'Identifier') return asyncFunctionNames.has(callee.name);
  if (callee.type === 'MemberExpression' && !callee.computed && callee.property.type === 'Identifier') {
    const name = callee.property.name;
    // `window.setTimeout(...)`, `this.window.setTimeout(...)`
    return asyncMethodNames.has(name) || asyncFunctionNames.has(name);
  }
  return false;
}

function isFunction(node) {
  return node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression';
}

/** `source$.pipe(...).subscribe(...)` where the chain starts at a form control's `valueChanges`. */
function isValueChangesSubscription(call) {
  for (let node = call.callee; node;) {
    if (node.type === 'MemberExpression') {
      if (!node.computed && node.property.type === 'Identifier' && node.property.name === 'valueChanges') return true;
      node = node.object;
    } else if (node.type === 'CallExpression') {
      node = node.callee;
    } else {
      return false;
    }
  }
  return false;
}

/**
 * The async callback `node` sits in, as the functions that run for the same event: the callback
 * itself, plus its `next`/`error`/`complete` siblings when it is part of a `subscribe({ ... })`
 * observer (`complete` runs straight after the last `next`). Null when `node` is not in one.
 */
function findAsyncCallback(node) {
  for (let current = node.parent; current; current = current.parent) {
    if (current.type === 'PropertyDefinition' || current.type === 'MethodDefinition') return null;
    if (!isFunction(current)) continue;

    let argument = current;
    let call = current.parent;
    let handlers = [current];
    // `subscribe({ next: (value) => ... })`
    if (call?.type === 'Property' && call.parent?.type === 'ObjectExpression') {
      argument = call.parent;
      handlers = call.parent.properties
        .filter((property) => property.type === 'Property' && isFunction(property.value))
        .map((property) => property.value);
      call = call.parent.parent;
    }
    if (call?.type === 'CallExpression' && call.arguments.includes(argument) && isAsyncCall(call)) {
      // A form control's value changes because of a template event, which already marks the view.
      if (isValueChangesSubscription(call)) return null;
      return handlers;
    }
  }
  return null;
}

/** `markForCheck()`/`detectChanges()`, or `this.<member>.set()`/`.update()` — a signal write re-renders the view. */
function isRerenderCall(call) {
  const name = calleeName(call.callee);
  if (rerenderCalls.has(name)) return true;
  const { callee } = call;
  return signalWriteCalls.has(name)
    && callee.type === 'MemberExpression'
    && callee.object.type === 'MemberExpression'
    && callee.object.object.type === 'ThisExpression';
}

/** `this.<name>(...)` — a call to a member of the same class. */
function thisMethodName(call) {
  const { callee } = call;
  return callee.type === 'MemberExpression'
    && callee.object.type === 'ThisExpression'
    && !callee.computed
    && callee.property.type === 'Identifier'
    ? callee.property.name
    : null;
}

/**
 * Whether `fn` re-renders the view, directly or through a method of the same class it calls
 * (`this.handleError(error)` where `handleError` calls `markForCheck()`).
 */
function callsRerender(fn, methods, visited = new Set()) {
  let found = false;
  const visit = (node) => {
    if (found || !node || typeof node.type !== 'string') return;
    if (node.type === 'CallExpression') {
      if (isRerenderCall(node)) {
        found = true;
        return;
      }
      const method = methods.get(thisMethodName(node));
      if (method && !visited.has(method)) {
        visited.add(method);
        if (callsRerender(method, methods, visited)) {
          found = true;
          return;
        }
      }
    }
    for (const [key, value] of Object.entries(node)) {
      if (key === 'parent') continue;
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === 'object') visit(value);
    }
  };
  visit(fn.body);
  return found;
}

function isComponentClass(classNode) {
  return (classNode.decorators ?? []).some((decorator) => {
    const expression = decorator.expression;
    return expression.type === 'CallExpression'
      && expression.callee.type === 'Identifier'
      && expression.callee.name === 'Component';
  });
}

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require a signal or markForCheck() when a component writes a field from an async callback',
    },
    schema: [],
    messages: {
      unmarkedWrite: '`{{field}}` is written from an async callback, which does not re-render a zoneless app. '
        + 'Make it a signal, call `cdr.markForCheck()` in this callback, or mark the field `private` '
        + 'if the template does not read it.',
    },
  },
  create(context) {
    const classes = [];

    return {
      ClassDeclaration(node) {
        const fields = new Set();
        const methods = new Map();
        if (isComponentClass(node)) {
          for (const member of node.body.body) {
            if (member.static || member.key.type !== 'Identifier') continue;
            if (member.type === 'MethodDefinition') {
              methods.set(member.key.name, member.value);
            } else if (member.type === 'PropertyDefinition') {
              // `private handleError = (error) => { ... }`
              if (member.value && isFunction(member.value)) methods.set(member.key.name, member.value);
              if (member.accessibility !== 'private') fields.add(member.key.name);
            }
          }
        }
        classes.push({ fields, methods });
      },
      'ClassDeclaration:exit'() {
        classes.pop();
      },
      AssignmentExpression(node) {
        const { fields, methods } = classes.at(-1) ?? {};
        if (!fields?.size) return;

        const { left } = node;
        if (
          left.type !== 'MemberExpression'
          || left.object.type !== 'ThisExpression'
          || left.computed
          || left.property.type !== 'Identifier'
          || !fields.has(left.property.name)
        ) {
          return;
        }

        const handlers = findAsyncCallback(node);
        if (!handlers || handlers.some((handler) => callsRerender(handler, methods))) return;

        context.report({ node, messageId: 'unmarkedWrite', data: { field: left.property.name } });
      },
    };
  },
};
