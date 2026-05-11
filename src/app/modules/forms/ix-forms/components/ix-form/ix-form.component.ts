import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
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
   * Comparison is a shallow per-top-level-key deep equality (lodash isEqual).
   * Nested FormGroups compare correctly, but a FormArray with one mutated
   * item appears as a single changed key whose value is the entire array —
   * forms needing granular array diffs should build their own payload.
   *
   * Snapshot uses `getRawValue()`, so disabled controls are included on both
   * sides; toggling a control's enabled state without changing its value
   * does not produce an entry here.
   *
   * If a submit depends on a group of fields moving together (e.g. paired
   * toggles), prefer `allValues` over this.
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
   * (success$ / onSuccess on the caller side) should observe. When
   * omitted, the raw request$ result is passed through — or `true` if
   * the request emitted `undefined`, since `undefined` is reserved to
   * signal a cancelled close.
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
 * Must be rendered inside a slide-in: the embedded `<ix-modal-header>` injects
 * `SlideIn` and `SlideInRef` non-optionally. Forms rendered on a standalone
 * route or outside `SlideIn.open(...)` will fail at construction with an
 * injector error. If a use case for that arises, `SlideIn`/`SlideInRef`
 * injection in the header (and this component) would need to become optional.
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
   * Only safe to use when the entity shape matches the form-control shape
   * 1-to-1. For entities that need key renames or transforms (e.g. API
   * `group` → form `name`), skip this and use `initialFormSnapshot` with
   * your own setup logic.
   *
   * Controls that are already disabled when this runs are NOT patched by
   * Angular's `patchValue` — the snapshot captured afterwards via
   * `getRawValue()` will therefore hold the control's default rather than
   * the value from `editData`. If such a control is later re-enabled, its
   * original value is seen as "unchanged" and won't appear in the diff.
   * If any control is disabled at init, use `initialFormSnapshot` and
   * patch the form yourself (use `setValue` or reset before disabling).
   */
  readonly editData = input<Partial<T> | null | undefined>(null);

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
   * Extra disabled gate ORed with the wrapper's built-in checks
   * (`formGroup.invalid`, `isLoading`, and `requireDirty && pristine`).
   * Use when Save should also depend on state outside `formGroup` — e.g. a
   * sibling FormGroup's validity, a child component's `valid` signal, or a
   * computed business rule. Pristine-submit via Enter is also blocked when
   * this is true.
   *
   * Pass a no-arg function (often a signal getter or computed) so the
   * binding stays reactive.
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
   * Internal loading state – set during form submission.
   */
  readonly isSubmitting = signal(false);

  /**
   * Combined loading state – true during either external loading or submit.
   */
  readonly isLoading = computed(() => this.isSubmitting() || this.externalLoading());

  private readonly internalSnapshot = signal<Partial<T> | null>(null);

  private slideInRef = inject(SlideInRef, { optional: true }) as SlideInRef<unknown, unknown> | null;
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

  ngOnInit(): void {
    if (this.slideInRef) {
      // `defer` makes the read lazy no matter how the slide-in chooses to
      // consume the returned observable (call-time or subscribe-time), and
      // also picks up a `dirtyPredicate` set after init.
      this.slideInRef.requireConfirmationWhen(() => defer(() => {
        const predicate = this.dirtyPredicate();
        return predicate ? predicate() : of(this.formGroup().dirty);
      }));
    }

    if (this.initialFormSnapshot() != null) {
      return;
    }

    const data = this.editData();
    if (data != null) {
      this.formGroup().patchValue(data as Record<string, unknown>);
      this.internalSnapshot.set(this.formGroup().getRawValue() as Partial<T>);
    }
  }

  onFormSubmit(): void {
    // Pressing Enter in an input fires ngSubmit even when the save button is
    // disabled, so guard here to match the disabled-button behavior.
    if (this.isLoading() || this.formGroup().invalid) {
      return;
    }
    if (this.requireDirty() && this.formGroup().pristine) {
      return;
    }
    if (this.extraDisabled()) {
      return;
    }

    const allValues = this.formGroup().getRawValue() as T;
    const event: FormSubmitEvent<T> = {
      isEdit: this.isEdit(),
      allValues,
      changedValues: this.getChangedValues(allValues),
    };

    const {
      request$, successMessage, onSuccess, onError, closeWith,
    } = this.submitHandler()(event);

    this.isSubmitting.set(true);
    let handledSuccess = false;
    request$.pipe(take(1), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (result: unknown) => {
        handledSuccess = true;
        this.snackbar.success(successMessage);
        onSuccess?.(result);
        const payload = closeWith ? closeWith(result) : result;
        // SlideInResponse treats `undefined` as a cancelled close, so coerce
        // to `true` when no caller-chosen payload is available.
        this.slideInRef?.close({ response: payload === undefined ? true : payload });
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
