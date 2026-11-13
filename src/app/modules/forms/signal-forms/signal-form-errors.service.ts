import {
  effect, inject, Injectable, isDevMode, signal, untracked,
} from '@angular/core';
import {
  FieldState, FieldTree, SchemaPath, SchemaPathTree, validateTree,
} from '@angular/forms/signals';
import {
  cloneDeep, get, isEqual, set,
} from 'lodash-es';
import { ApiErrorName } from 'app/enums/api.enum';
import { JobExceptionType } from 'app/enums/response-error-type.enum';
import { isApiCallError, isApiErrorDetails, isFailedJobError } from 'app/helpers/api.helper';
import { manualValidateErrorKey } from 'app/modules/forms/ix-forms/manual-validate-error.constants';
import {
  errorTarget, fieldAt, FieldPath,
} from 'app/modules/forms/signal-forms/signal-forms.utils';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

/** One server verdict, pinned on the field it names. */
interface PinnedError {
  /** Where the error is shown, from the root of the form. */
  path: FieldPath;
  field: FieldTree<unknown>;
  message: string;
  /** The field's value when the verdict arrived, so an edit to it can be told apart from one elsewhere. */
  valueAtPin: unknown;
}

/**
 * `FormErrorHandlerService` for a signal form: pins API validation errors under fields, row paths included.
 * Provide it on the form and call {@link apply} in the schema; `<ix-form [fieldTree]>` connects it and sends
 * failed saves to it. Not Angular's `submit()` errors, which clear only when their own field changes and so
 * leave Save stuck on a verdict answered elsewhere (Force for an unreachable NTP server); see {@link retireOnEdit}.
 * Pattern and rules: `docs/devs/signal-forms.md`.
 */
@Injectable()
export class SignalFormErrors {
  private errorHandler = inject(ErrorHandlerService);

  private readonly root = signal<FieldTree<unknown> | null>(null);
  private readonly pinned = signal<PinnedError[]>([]);

  /** The whole model when the current verdicts arrived; see {@link retireOnEdit}. */
  private valueAtPin: unknown = null;

  constructor() {
    effect(() => this.retireOnEdit());
  }

  /**
   * The schema rule that reports the pinned errors. Call it once, on the root path, inside the
   * `form()` schema.
   */
  apply<T>(path: SchemaPathTree<T>): void {
    validateTree(path as SchemaPath<T>, () => this.pinned().map((pin) => ({
      kind: manualValidateErrorKey,
      message: pin.message,
      fieldTree: errorTarget(pin.field),
    })));
  }

  /** Points the service at the form it reports for. `<ix-form [fieldTree]>` calls this itself. */
  connect<T>(root: FieldTree<T>): void {
    const tree = root as FieldTree<unknown>;
    if (this.root() !== tree) {
      this.pinned.set([]);
      this.root.set(tree);
    }
  }

  /**
   * Pins the field errors in an API validation failure (a call's, or a failed job's) and shows the
   * rest in the error modal. Any other error goes to the error modal as is.
   *
   * @param fieldsMap Renames backend fields to model fields, by leaf name (`{ ntpserver: 'address' }`)
   * or by full path without the method prefix.
   */
  handleValidationErrors(error: unknown, fieldsMap: Record<string, string> = {}): void {
    const extra = this.validationExtra(error);
    const root = this.root();
    if (!extra || !root) {
      if (extra && isDevMode()) {
        console.warn('[SignalFormErrors] Not connected to a form, so field errors went to the error modal. '
          + 'Bind the form with <ix-form [fieldTree]> or call connect().');
      }
      this.errorHandler.showErrorModal(error);
      return;
    }

    const pins: PinnedError[] = [];
    const unhandled: string[] = [];
    for (const [errorPath, message] of extra) {
      const path = this.findField(root, errorPath, fieldsMap);
      const field = path ? fieldAt(root, path) : null;
      if (!path || !field) {
        unhandled.push(`${errorPath}: ${message}`);
        continue;
      }
      pins.push({
        path, field, message, valueAtPin: field().value(),
      });
    }

    this.valueAtPin = root().value();
    this.pinned.set(pins);
    pins.forEach((pin) => pin.field().markAsTouched());
    this.focus(pins[0]?.field);

    if (unhandled.length) {
      this.errorHandler.showErrorModal(new Error(`Validation errors:\n${unhandled.join('\n')}`));
    }
  }

  /**
   * Drops the verdicts pinned on `field`. `tn-form-field` only hides a signal form error the user
   * dismisses; without this the field would stay invalid and keep Save disabled.
   * `IxSignalErrorDismissDirective` calls it.
   */
  dismiss(field: FieldState<unknown>): void {
    this.pinned.update((pins) => {
      const kept = pins.filter((pin) => pin.field() !== field);
      return kept.length === pins.length ? pins : kept;
    });
  }

  /** Drops every pinned verdict. */
  clear(): void {
    this.pinned.set([]);
  }

  /**
   * Editing a flagged field retires that field's verdict. Editing anything else retires them all,
   * because a verdict can be answered from another field and would otherwise never go away.
   */
  private retireOnEdit(): void {
    const root = this.root();
    const pins = this.pinned();
    if (!root || !pins.length) {
      return;
    }
    const current = root().value();
    if (current === this.valueAtPin) {
      return;
    }

    untracked(() => {
      const previous = this.valueAtPin;
      this.valueAtPin = current;
      const flaggedOnly = isEqual(this.withoutPinned(current, pins), this.withoutPinned(previous, pins));
      if (!flaggedOnly) {
        this.pinned.set([]);
        return;
      }
      const kept = pins.filter((pin) => isEqual(get(current, pin.path), pin.valueAtPin));
      if (kept.length < pins.length) {
        this.pinned.set(kept);
      }
    });
  }

  /** `value` with every pinned path blanked, so only edits outside the flagged fields remain. */
  private withoutPinned(value: unknown, pins: PinnedError[]): unknown {
    if (!value || typeof value !== 'object') {
      return value;
    }
    const copy = cloneDeep(value);
    pins.forEach((pin) => set(copy, pin.path as (string | number)[], null));
    return copy;
  }

  /**
   * Where an API error path lands in the form. Tries, in order: a `fieldsMap` rename, the full path
   * after the method prefix (`app_create.aliases.0.host` → `aliases.0.host`), the full path as given,
   * and the leaf name at the top level, as `FormErrorHandlerService` does. Then climbs to the nearest
   * field that is on screen.
   */
  private findField(
    root: FieldTree<unknown>,
    errorPath: string,
    fieldsMap: Record<string, string>,
  ): FieldPath | null {
    const segments = errorPath.split('.').filter(Boolean).map((part) => (/^\d+$/.test(part) ? Number(part) : part));
    const withoutPrefix = segments.slice(1);
    const leaf = segments.findLast((part) => typeof part === 'string') as string | undefined;
    const renamed = fieldsMap[withoutPrefix.join('.')] ?? (leaf ? fieldsMap[leaf] : undefined);

    const candidates: FieldPath[] = [
      ...(renamed ? [renamed.split('.')] : []),
      withoutPrefix,
      segments,
      ...(leaf ? [[leaf]] : []),
    ].filter((path) => path.length > 0);

    for (const candidate of candidates) {
      const shown = this.nearestShown(root, candidate);
      if (shown) {
        return shown;
      }
    }
    return null;
  }

  /**
   * `path` if it names a field bound to a control on screen, else its nearest such ancestor below the
   * root. `null` when the path names no field, or nothing on it is on screen (hidden, or payload-only).
   */
  private nearestShown(root: FieldTree<unknown>, path: FieldPath): FieldPath | null {
    if (!fieldAt(root, path)) {
      return null;
    }
    for (let length = path.length; length > 0; length--) {
      const candidate = path.slice(0, length);
      const field = fieldAt(root, candidate);
      if (field && field().formFieldBindings().length > 0) {
        return candidate;
      }
    }
    return null;
  }

  private validationExtra(error: unknown): [string, string][] | null {
    if (
      isApiCallError(error)
      && isApiErrorDetails(error.error.data)
      && error.error.data.errname === ApiErrorName.Validation
      && error.error.data.extra
    ) {
      return this.toEntries(error.error.data.extra);
    }
    if (isFailedJobError(error) && error.job.exc_info?.type === JobExceptionType.Validation) {
      return this.toEntries(error.job.exc_info.extra);
    }
    return null;
  }

  private toEntries(extra: unknown): [string, string][] | null {
    if (!Array.isArray(extra)) {
      return null;
    }
    const entries = extra.filter((item): item is [string, string] => (
      Array.isArray(item) && typeof item[0] === 'string' && typeof item[1] === 'string'
      && item[0].trim() !== '' && item[1].trim() !== ''
    ));
    return entries.length ? entries : null;
  }

  /**
   * Scrolls to the field and focuses it, after the render that shows the message. Not
   * `focusBoundControl()` alone: for a control bound as a `ControlValueAccessor`, which every tn-* control
   * is, Angular focuses the component host, which has no tabindex and ignores it. The native control
   * inside is what takes focus, as in `FormErrorHandlerService`.
   */
  private focus(field: FieldTree<unknown> | undefined): void {
    const element = field?.().formFieldBindings()[0]?.element;
    if (!element) {
      return;
    }
    setTimeout(() => {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (element.querySelector<HTMLElement>('input, textarea, select') ?? element).focus();
    });
  }
}
