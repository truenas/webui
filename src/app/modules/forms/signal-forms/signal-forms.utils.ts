import { FieldTree, ReadonlyFieldTree } from '@angular/forms/signals';
import { cloneDeep, isPlainObject } from 'lodash-es';

/** A path into a form model: object keys and array indices, root first. */
export type FieldPath = readonly (string | number)[];

/**
 * Whether a form input is a signal form's field tree rather than a Reactive `FormGroup`. A field tree is
 * callable (reading it returns its state); a `FormGroup` never is.
 */
export function isFieldTree(value: unknown): value is FieldTree<unknown> {
  return typeof value === 'function';
}

/**
 * Copies data into a shape a signal form can own. Signal forms write a tracking symbol onto every
 * array row of the model, so a row that is frozen throws a `TypeError`, sometimes from inside an
 * internal effect. NgRx freezes store state in dev mode, and so does anything that came out of a
 * selector, so **always pass store or API data through this before it reaches a model signal**.
 * `<ix-form>` and `IxFormHostForm` already do it for `editData` and `loadFormConfig`.
 */
export function toFormModel<T>(value: T): T {
  return cloneDeep(value);
}

/**
 * Narrows a field tree to the type a validation error's `fieldTree` expects.
 *
 * Targeting an error at another field (`{ kind, fieldTree: fieldTree.name }`) only type-checks under
 * `strictNullChecks`. This repo is on `strict: false`, where the same line is an error, so cross-field
 * rules need a cast. Keeping it here means one cast to delete when the app moves to strict.
 */
export function errorTarget(field: unknown): ReadonlyFieldTree<unknown> {
  return field as ReadonlyFieldTree<unknown>;
}

/**
 * Follows `path` from `root` through the field tree. Returns `null` when any segment is not a field:
 * an unknown key, or an index past the end of an array.
 */
export function fieldAt(root: FieldTree<unknown>, path: FieldPath): FieldTree<unknown> | null {
  let node: unknown = root;
  for (const segment of path) {
    if (!isFieldTree(node)) {
      return null;
    }
    node = (node as unknown as Record<string | number, unknown>)[segment];
  }
  return isFieldTree(node) ? node : null;
}

/**
 * The model value with every hidden or disabled field left out, which is what a payload should be built
 * from.
 *
 * Unlike `FormGroup.value`, a signal form's model keeps the values of fields that are hidden or
 * disabled, so building a payload straight from the model sends whatever a field held before it was
 * hidden. Plain objects and arrays are walked: a hidden or disabled group is dropped whole, and so is a
 * hidden field inside a row. Rows themselves are always kept, so indices still line up with the model.
 */
export function activeValue<T>(tree: FieldTree<T>): Partial<T> {
  return activeValueOf(tree as FieldTree<unknown>) as Partial<T>;
}

function activeValueOf(tree: FieldTree<unknown>): unknown {
  const value = tree().value();
  if (Array.isArray(value)) {
    return value.map((item: unknown, index) => {
      const row = fieldAt(tree, [index]);
      return row ? activeValueOf(row) : item;
    });
  }
  if (!isPlainObject(value)) {
    return value;
  }

  const result: Record<string, unknown> = {};
  for (const key of Object.keys(value as object)) {
    const child = fieldAt(tree, [key]);
    if (!child) {
      result[key] = (value as Record<string, unknown>)[key];
      continue;
    }
    const state = child();
    if (state.hidden() || state.disabled()) {
      continue;
    }
    result[key] = activeValueOf(child);
  }
  return result;
}
