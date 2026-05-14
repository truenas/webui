import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  isDevMode,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { isEqual } from 'lodash-es';
import {
  defer, Observable, of, take,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TranslatedString } from 'app/modules/translate/translate.helper';

export interface FormSubmitEvent<T = Record<string, unknown>> {
  /**
   * Whether this form is in edit mode.
   */
  isEdit: boolean;

  /**
   * All current form values (equivalent to formGroup.getRawValue()).
   */
  allValues: T;

  /**
   * Keys from `allValues` that differ from the initial snapshot.
   * In create mode this equals `allValues`. Only keys present in the current
   * form value are considered — fields removed from the form structure
   * after init won't appear here. Conversely, controls `addControl`'d after
   * the snapshot was captured are absent from the snapshot and therefore
   * always treated as changed, even if their value matches the default.
   *
   * `removeControl` after the snapshot is the asymmetric case: the removed
   * key is gone from `allValues` so the diff silently omits it, even if its
   * pre-removal value was meaningful. Forms that toggle controls in/out
   * dynamically should call `refreshSnapshot()` after the structural
   * change so the baseline matches the new shape (or build the payload
   * from `allValues` directly).
   *
   * Comparison is a shallow per-top-level-key deep equality (lodash isEqual).
   * Nested FormGroups and FormArrays compare correctly by value, but the
   * diff is reported at the top-level key only: any change inside a nested
   * group/array appears as a single entry whose value is the *entire*
   * nested object. Forms whose API expects an all-or-nothing block per
   * nested group can rely on this; forms needing a leaf-level diff inside
   * a nested group should build their own payload from `allValues`.
   *
   * Snapshot uses `getRawValue()`, so disabled controls are included on both
   * sides; toggling a control's enabled state without changing its value
   * does not produce an entry here.
   *
   * If a submit depends on a group of fields moving together (e.g. paired
   * toggles), prefer `allValues` over this. Known cases where the diff is
   * unsafe and the handler should build its own payload from `allValues`
   * (or a transform of the form value):
   *   - **Derived/paired controls** — e.g. a list value gated by a sibling
   *     "use defaults" toggle. A diff that only includes the changed half
   *     drops the pairing.
   *   - **Inherit semantics** — controls where the user-visible value is
   *     "inherit" but the API expects either the sentinel string or an
   *     omitted key depending on context.
   *   - **Heavy payload transforms** — forms whose submit handler reshapes
   *     the form value into a structurally different API shape (renamed
   *     keys, nested encryption blocks, schedule normalization, etc.).
   *     A key-by-key diff won't line up with the API shape.
   *   - **Multi-stage forms** — when controls are added/removed after
   *     init, see `IxFormComponent.refreshSnapshot()` for the recovery
   *     path; without it, late-added controls always appear changed.
   */
  changedValues: Partial<T>;
}

export interface SubmitResult {
  request$: Observable<unknown>;
  successMessage: TranslatedString;

  /**
   * Callback invoked after the request succeeds and before the slide-in
   * closes. Runs synchronously between the snackbar and the close call,
   * so store dispatches / router navigation here will fire before the
   * slide-in animates out. Receives the value emitted by request$.
   */
  onSuccess?: (result: unknown) => void;

  /**
   * Custom error handler. Return true if the error was handled and the
   * default form error handler should be skipped.
   */
  onError?: (error: unknown) => boolean;

  /**
   * Override the payload the slide-in closes with. Receives the value
   * emitted by request$ and must return what downstream listeners
   * (success$ / onSuccess on the caller side) should observe.
   *
   * When `closeWith` is omitted, the raw `request$` result is passed
   * through. There is one coercion: if both `closeWith` is omitted AND
   * `request$` emits `undefined`, the slide-in closes with `true`.
   * That coercion exists because `SlideInResponse` treats `undefined`
   * as a cancelled close, and a successful submit must not look like a
   * cancel to upstream `.onSuccess(...)` listeners.
   *
   * Caveat: any caller whose `request$` emits `undefined` AND who wants
   * upstream listeners to receive `undefined` (or any other specific
   * payload) MUST provide `closeWith` — relying on pass-through will
   * silently observe `true` on the success$ side. In practice, prefer
   * providing `closeWith` whenever the API endpoint's success payload
   * is `void`/`undefined` so the contract is explicit at the call site.
   */
  closeWith?: (result: unknown) => unknown;
}

/**
 * Unified form wrapper component that standardizes form behavior and layout.
 *
 * Handles:
 * - Common chrome: modal header, card wrapper, save button, form actions.
 * - Change tracking: captures initial form state and provides a diff on submit.
 * - Loading state: shows progress bar in header and disables save button.
 * - Dirty confirmation: auto-registers with SlideInRef (when present).
 * - Submit lifecycle: loading → API call → success snackbar + close / error handling.
 *
 * Simple usage (auto title from addTitle/editTitle, auto-patches form with editData):
 * ```html
 * <ix-form [formGroup]="form" [editData]="existingEntity"
 *          [addTitle]="'Add Group' | translate"
 *          [editTitle]="'Edit Group' | translate"
 *          [requiredRoles]="requiredRoles" [submitHandler]="handleSubmit">
 *   <ix-fieldset [title]="'Options' | translate">
 *     <ix-input formControlName="name" [label]="'Name' | translate" />
 *   </ix-fieldset>
 * </ix-form>
 * ```
 *
 * With extra action buttons:
 * ```html
 * <ix-form [formGroup]="form" [addTitle]="'Add NFS Share' | translate" ...>
 *   <ix-fieldset>...</ix-fieldset>
 *   <button ixExtraActions mat-button (click)="toggleAdvanced()">
 *     {{ 'Advanced Options' | translate }}
 *   </button>
 * </ix-form>
 * ```
 *
 * Complex usage (form manages its own patching and async setup):
 * ```html
 * <ix-form [formGroup]="form" [initialFormSnapshot]="formSnapshot()"
 *          [externalLoading]="setupLoading()" [isEditMode]="!!editingEntity"
 *          [addTitle]="'Add X' | translate" [editTitle]="'Edit X' | translate"
 *          [requiredRoles]="requiredRoles" [submitHandler]="handleSubmit">
 *   ...
 * </ix-form>
 * ```
 *
 * Pick one of `editData` or `initialFormSnapshot` — when both are provided
 * `initialFormSnapshot` wins and the editData auto-patch is skipped.
 *
 * When the snapshot resolves asynchronously (e.g. after an API call), pair
 * `initialFormSnapshot` with an explicit `isEditMode` binding driven by the
 * source entity. Otherwise the title briefly shows "Add …" before the
 * snapshot settles, since inferred edit state sees a null snapshot on init.
 *
 * Must be rendered inside a slide-in: this component and the embedded
 * `<ix-modal-header>` both inject `SlideInRef`, and the header also injects
 * `SlideIn`. Forms rendered on a standalone route or outside `SlideIn.open(...)`
 * will fail at construction with an injector error. If a use case for that
 * arises, the injections in this component and the header would need to
 * become optional in lockstep.
 */
@Component({
  selector: 'ix-form',
  templateUrl: './ix-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class IxFormComponent<T extends object = Record<string, unknown>> implements OnInit {
  /**
   * The reactive FormGroup this form manages.
   */
  readonly formGroup = input.required<FormGroup>();

  /**
   * Initial entity data for edit mode. Pass undefined/null for create mode.
   * When provided, the form is auto-patched via `patchValue` during this
   * component's `ngOnInit`, which runs after the host component's own
   * `ngOnInit`. Any `valueChanges` listeners the host set up at init will
   * fire once as the patch lands — if that ordering matters (e.g. a
   * listener that gates other controls based on the initial value),
   * prefer `initialFormSnapshot` and patch the form yourself before
   * handing the snapshot to this component.
   *
   * Two shapes are accepted:
   * - Without `transformEditData`: pass `Partial<T>` matching the form
   *   shape 1-to-1.
   * - With `transformEditData`: pass the raw entity (any object). The
   *   transform's input is typed as `unknown` precisely because the
   *   entity rarely matches `Partial<T>` — see `transformEditData`.
   *
   * The input is intentionally typed as `Partial<T> | object` so consumers
   * binding an entity (e.g. `[editData]="apiEntity"`) don't need a cast,
   * while consumers passing pre-shaped form data still get the structural
   * check on `Partial<T>`.
   *
   * Controls that are already disabled when this runs are NOT patched by
   * Angular's `patchValue` — the snapshot captured afterwards via
   * `getRawValue()` will therefore hold the control's default rather than
   * the value from `editData`. If such a control is later re-enabled, its
   * original value is seen as "unchanged" and won't appear in the diff.
   * If any control is disabled at init, use `initialFormSnapshot` and
   * patch the form yourself (use `setValue` or reset before disabling).
   */
  readonly editData = input<Partial<T> | object | null | undefined>(null);

  /**
   * Transform `editData` from API/entity shape to form-value shape before
   * the wrapper auto-patches the form. Use when the entity has nested or
   * renamed fields (e.g., `entity.attributes.type` → `form.type`).
   *
   * Receives the raw `editData` value (cast to `unknown` since the entity
   * is unlikely to match `Partial<T>`) and must return the form's expected
   * shape. The returned object is fed to `patchValue` and then captured as
   * the internal snapshot.
   *
   * Skipped when `editData` is null or `initialFormSnapshot` is provided.
   * The same disabled-controls caveat applies — see `editData`.
   */
  readonly transformEditData = input<((data: unknown) => Partial<T>) | null>(null);

  /**
   * External initial snapshot for change tracking. Use this when the form
   * does its own async setup/patching. Pass the result of
   * formGroup.getRawValue() after setup is complete.
   */
  readonly initialFormSnapshot = input<Partial<T> | null>(null);

  /**
   * Explicit title shown in the modal header.
   * Takes precedence over addTitle/editTitle.
   */
  readonly title = input<string>('');

  /**
   * Title for create mode (e.g. 'Add Group' | translate).
   * Used when no explicit title is set and the form is in create mode.
   */
  readonly addTitle = input<string>('');

  /**
   * Title for edit mode (e.g. 'Edit Group' | translate).
   * Used when no explicit title is set and the form is in edit mode.
   */
  readonly editTitle = input<string>('');

  /**
   * Roles required to submit the form.
   */
  readonly requiredRoles = input<Role[]>([]);

  /**
   * Callback that receives the form submit event and returns the API
   * request and success message. The component handles the full lifecycle:
   * loading state → API call → snackbar + close / error handling.
   *
   * Note: Angular templates don't support explicit generic type args on
   * components, so `T` defaults to `Record<string, unknown>` at the binding
   * site. Consumers get real type safety on `event` by typing the handler
   * itself as `(event: FormSubmitEvent<MyFormShape>) => SubmitResult`.
   */
  readonly submitHandler = input.required<(event: FormSubmitEvent<T>) => SubmitResult>();

  /**
   * Hook invoked between the wrapper's submit-disabled guards and
   * `submitHandler`. Receives the built `FormSubmitEvent` and may:
   * - return a new `FormSubmitEvent<T>` to forward to `submitHandler`
   *   (use for adding computed fields, normalizing values, etc.);
   * - return `false` to cancel the submit silently (the wrapper resets
   *   its loading state and stays open — no error path runs).
   *
   * Most cases can also be handled inside `submitHandler` itself; reach
   * for this hook when it's cleaner to keep payload-shaping isolated from
   * request orchestration, or to gate a submit on async user confirmation
   * that should NOT surface as a request error.
   */
  readonly preSubmit = input<((event: FormSubmitEvent<T>) => FormSubmitEvent<T> | false) | null>(null);

  /**
   * Callback fired when the form's slide-in is destroyed without a
   * successful submit — i.e. user cancelled via close-X / escape /
   * click-outside, or any caller called `slideInRef.close({ response:
   * undefined })`. Also fires on `slideInRef.swap(...)` since the
   * destroyed-without-submit condition is the same.
   *
   * Use for cleanup that must run on cancel paths — releasing a
   * server-side lock acquired during setup, reverting a temporary
   * preview, telemetry, etc. Does NOT fire when submit succeeds.
   */
  readonly onCancel = input<(() => void) | null>(null);

  /**
   * External loading state (e.g., during async setup). Combined with
   * internal submit loading to control the header progress bar and
   * save button disabled state.
   */
  readonly externalLoading = input(false);

  /**
   * Explicit edit-mode override. When set, takes precedence over the value
   * inferred from `editData` / `initialFormSnapshot`.
   *
   * Recommended whenever the inferred check would be ambiguous — e.g. forms
   * that pass an always-populated `editData` object, forms whose snapshot
   * resolves asynchronously, or singleton-config forms that are "always
   * editing". The inferred edit state only checks for `!= null` on the
   * snapshot, which treats an empty object as edit mode.
   */
  readonly isEditMode = input<boolean | null>(null);

  /**
   * When true, the Save button stays disabled while the form is pristine,
   * and a pristine submit (e.g. via Enter) is ignored. Use for forms where
   * submitting without edits has no meaningful effect — singleton-config
   * forms that no-op when nothing changed, edit modals that would otherwise
   * resubmit the unchanged entity, etc.
   *
   * Default is false so create forms (where `pristine === true` is normal
   * at first interaction) keep their existing behavior.
   */
  readonly requireDirty = input(false);

  /**
   * When true, the wrapper skips the success snackbar after a successful
   * submit. Use for "config-builder" forms whose submit returns a payload
   * to the caller rather than persisting via an API call — there's nothing
   * to congratulate the user about, and the toast reads as noise.
   *
   * The slide-in still closes (with `closeWith` / the raw request$ result)
   * and `onSuccess` still fires; only the snackbar is suppressed.
   */
  readonly suppressSuccessSnackbar = input(false);

  /**
   * Extra disabled gate ORed with the wrapper's built-in checks
   * (`formGroup.invalid`, `isLoading`, and `requireDirty && pristine`).
   * Use when Save should also depend on state outside `formGroup` — e.g. a
   * sibling FormGroup's validity, a child component's `valid` signal, or a
   * computed business rule. Pristine-submit via Enter is also blocked when
   * this is true.
   *
   * This wrapper is OnPush, so the binding only re-evaluates when something
   * marks the host for check. Drive it from a `signal`, `computed`, or a
   * binding that depends on an `input()` — those automatically schedule
   * CD when their underlying state changes. A plain getter that reads
   * non-signal external state will appear "stuck" until an unrelated event
   * happens to mark the host for check; avoid that pattern.
   */
  readonly extraDisabled = input<boolean>(false);

  /**
   * Override for the dirty-confirmation check. The factory returns an
   * Observable that emits `true` when the slide-in should ask the user to
   * confirm closing (i.e. the form has unsaved changes).
   *
   * Default behavior reads `formGroup.dirty`. Override when:
   * - the form has multiple FormGroups (e.g. a main form plus sub-section
   *   forms) and dirty status must combine them all;
   * - dirty isn't the right signal (e.g. the form tracks an external
   *   `hasChanges` signal outside the FormGroup);
   * - the form should never prompt (e.g. read-only-style forms) — return
   *   `of(false)`.
   *
   * The factory is re-invoked each time the slide-in checks, so it can read
   * live state.
   */
  readonly dirtyPredicate = input<(() => Observable<boolean>) | null>(null);

  /**
   * Submit-only loading state, true while the wrapper's submit lifecycle
   * is in flight. Consumer-stable: hosts read this via a template ref
   * (e.g. `#ixForm` + `ixForm.isSubmitting()`) to gate extra-action
   * buttons during submit. Renames here are breaking.
   */
  readonly isSubmitting = signal(false);

  /**
   * Combined loading state: submit OR `externalLoading`. Consumer-stable
   * for the same reason as `isSubmitting`.
   */
  readonly isLoading = computed(() => this.isSubmitting() || this.externalLoading());

  private readonly internalSnapshot = signal<Partial<T> | null>(null);

  // Set true once submitHandler's request$ has emitted successfully. Read
  // by the DestroyRef hook to decide whether to fire `onCancel`.
  private hadSuccessfulSubmit = false;

  // Required, not optional: the embedded <ix-modal-header> injects SlideInRef
  // non-optionally already, so a non-slide-in render fails at the header
  // regardless. Keeping this required surfaces the error closer to the source
  // and matches the contract documented above (must be rendered inside a
  // slide-in). Tests render <ix-form> via ixFormTestingProviders(), which
  // supplies a SlideInRef mock — no production caller renders it standalone.
  private slideInRef = inject<SlideInRef<unknown, unknown>>(SlideInRef);
  private errorHandler = inject(FormErrorHandlerService);
  private snackbar = inject(SnackbarService);
  private destroyRef = inject(DestroyRef);

  private readonly snapshot = computed<Partial<T> | null>(() => {
    return this.initialFormSnapshot() ?? this.internalSnapshot();
  });

  readonly isEdit = computed(() => {
    const override = this.isEditMode();
    if (override !== null) {
      return override;
    }
    return this.editData() != null || this.snapshot() != null;
  });

  /**
   * Resolved title: explicit title wins, otherwise picks addTitle or editTitle
   * based on mode.
   */
  readonly resolvedTitle = computed(() => {
    return this.title() || (this.isEdit() ? this.editTitle() : this.addTitle());
  });

  /**
   * Single source of truth for "Save should be blocked". Both the button's
   * `[disabled]` binding and the Enter-key guard in `onFormSubmit` read this,
   * so the two can't drift out of sync. Implemented as a method (not a
   * `computed`) because the form's `invalid` / `pristine` flags are not
   * signals — a memoized computed wouldn't re-run when the form changes.
   * Re-evaluation happens naturally during the template's CD pass.
   */
  protected isSaveDisabled(): boolean {
    const form = this.formGroup();
    return form.invalid
      || this.isLoading()
      || (this.requireDirty() && form.pristine)
      || this.extraDisabled();
  }

  ngOnInit(): void {
    // `defer` makes the read lazy no matter how the slide-in chooses to
    // consume the returned observable (call-time or subscribe-time), and
    // also picks up a `dirtyPredicate` set after init.
    this.slideInRef.requireConfirmationWhen(() => defer(() => {
      const predicate = this.dirtyPredicate();
      return predicate ? predicate() : of(this.formGroup().dirty);
    }));

    // Wire onCancel via DestroyRef so it fires on every non-success destroy
    // path (close-X, escape, programmatic cancel, swap). The success path
    // sets `hadSuccessfulSubmit` before closing the slide-in.
    this.destroyRef.onDestroy(() => {
      if (!this.hadSuccessfulSubmit) {
        this.onCancel()?.();
      }
    });

    if (this.initialFormSnapshot() != null) {
      return;
    }

    const data = this.editData();
    if (data != null) {
      const transform = this.transformEditData();
      const patchData = transform ? transform(data) : (data as Partial<T>);
      this.formGroup().patchValue(patchData);
      // patchValue doesn't mark the form dirty today, but markAsPristine is
      // defensive against a refactor swapping in setValue (which would mark
      // dirty) and against any nested controls a user-supplied transform
      // might have produced via setValue under the hood.
      this.formGroup().markAsPristine();
      this.internalSnapshot.set(this.formGroup().getRawValue() as Partial<T>);
    }
  }

  onFormSubmit(): void {
    // Pressing Enter in an input fires ngSubmit even when the save button is
    // disabled, so guard here using the same predicate that drives the
    // button's `[disabled]` binding.
    if (this.isSaveDisabled()) {
      return;
    }

    const allValues = this.formGroup().getRawValue() as T;
    let event: FormSubmitEvent<T> = {
      isEdit: this.isEdit(),
      allValues,
      changedValues: this.getChangedValues(allValues),
    };

    const preSubmit = this.preSubmit();
    if (preSubmit) {
      const result = preSubmit(event);
      if (result === false) {
        return;
      }
      event = result;
    }

    const {
      request$, successMessage, onSuccess, onError, closeWith,
    } = this.submitHandler()(event);

    this.isSubmitting.set(true);
    let handledSuccess = false;
    request$.pipe(take(1), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (result: unknown) => {
        handledSuccess = true;
        this.hadSuccessfulSubmit = true;
        if (!this.suppressSuccessSnackbar()) {
          this.snackbar.success(successMessage);
        }
        onSuccess?.(result);
        const payload = closeWith ? closeWith(result) : result;
        // SlideInResponse treats `undefined` as a cancelled close, so coerce
        // to `true` when no caller-chosen payload is available. Warn in dev
        // mode when the coercion actually triggers — callers wiring
        // `.onSuccess((res) => …)` to a void endpoint will silently observe
        // `true` instead of `undefined` unless they provide `closeWith`.
        if (payload === undefined) {
          if (isDevMode()) {
            console.warn(
              '[ix-form] submitHandler.request$ emitted undefined and no closeWith was provided; '
              + 'slide-in will close with `true` so upstream listeners don\'t observe a cancel. '
              + 'Provide an explicit `closeWith` in SubmitResult to silence this warning.',
            );
          }
          this.slideInRef.close({ response: true });
        } else {
          this.slideInRef.close({ response: payload });
        }
        // Re-enable the button *after* close so a synchronous-complete
        // observable doesn't briefly expose an enabled save button while the
        // modal is animating out.
        this.isSubmitting.set(false);
      },
      error: (error: unknown) => {
        this.isSubmitting.set(false);
        if (!onError?.(error)) {
          this.errorHandler.handleValidationErrors(error, this.formGroup());
        }
      },
      // Safety net for observables that complete without emitting (e.g. EMPTY):
      // neither next nor error would run, leaving the form stuck in submitting.
      // Skip when `next` already ran — the reset there is intentionally ordered
      // after the close call.
      complete: () => {
        if (!handledSuccess) {
          this.isSubmitting.set(false);
        }
      },
    });
  }

  /**
   * Re-capture the current form value as the diff baseline. Call after any
   * post-init form mutation that should be considered "initial state" — e.g.
   * `addControl`/`removeControl` calls, async setup that toggles enabled
   * state, or anything else that changes the structure of the form after
   * `editData`/`initialFormSnapshot` were applied.
   *
   * Without this, controls added later are absent from the original snapshot
   * and `getChangedValues` will always flag them as changed even when the
   * user never touched them — see the FormSubmitEvent.changedValues docs.
   *
   * No-op when `initialFormSnapshot` is bound externally: the wrapper does
   * not own that snapshot, so the consumer should re-emit a fresh value
   * through the input instead.
   *
   * Consumer-stable: hosts call this via a template ref after structural
   * form changes. Renames are breaking.
   */
  refreshSnapshot(): void {
    if (this.initialFormSnapshot() != null) {
      return;
    }
    this.internalSnapshot.set(this.formGroup().getRawValue() as Partial<T>);
  }

  private getChangedValues(current: T): Partial<T> {
    const snapshot = this.snapshot();
    if (!snapshot) {
      return { ...current };
    }

    const changed: Partial<T> = {};
    for (const key of Object.keys(current) as (keyof T)[]) {
      if (!(key in snapshot) || !isEqual(current[key], snapshot[key])) {
        changed[key] = current[key];
      }
    }
    return changed;
  }
}
