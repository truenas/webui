import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  isDevMode,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormArray, FormControlStatus, FormGroup, ReactiveFormsModule,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { isEqual } from 'lodash-es';
import {
  defer, Observable, of, startWith, take,
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
  /** Whether this form is in edit mode. */
  isEdit: boolean;

  /** All current form values (formGroup.getRawValue()). */
  allValues: T;

  /**
   * Top-level keys whose value differs from the initial snapshot (create mode:
   * all of them). Disabled controls are excluded — a field hidden/disabled by
   * `visibleWhen`/`enabledWhen` never appears here, so its stale value can't leak
   * into a "only send what changed" payload. Use `allValues` if you genuinely
   * need disabled values. Shallow per-key deep-equality; nested groups report as
   * one whole-object entry. Build from `allValues` instead for paired/derived
   * controls, inherit sentinels, or payload reshaping.
   */
  changedValues: Partial<T>;
}

export interface SubmitResult {
  request$: Observable<unknown>;
  successMessage: TranslatedString;

  /** Runs after success, before close (store/navigation fire pre-animation). */
  onSuccess?: (result: unknown) => void;

  /** Return true if handled, to skip the default form error handler. */
  onError?: (error: unknown) => boolean;

  /**
   * Payload the slide-in closes with (default: raw request$ result). An emitted
   * `undefined` is coerced to `true` since SlideInResponse reads `undefined` as
   * a cancel — set this when listeners must see the real value.
   */
  closeWith?: (result: unknown) => unknown;
}

/**
 * Unified form wrapper: modal header + card + save/actions chrome, change
 * tracking (snapshot + submit diff), loading state, dirty confirmation, and the
 * submit lifecycle (loading → API call → snackbar + close / error handling).
 *
 * ```html
 * <ix-form [formGroup]="form" [editData]="entity"
 *          [addTitle]="'Add Group' | translate" [editTitle]="'Edit Group' | translate"
 *          [requiredRoles]="requiredRoles" [submitHandler]="handleSubmit">
 *   <ix-fieldset><ix-input formControlName="name" [label]="'Name' | translate" /></ix-fieldset>
 * </ix-form>
 * ```
 *
 * For self-managed async setup use `initialFormSnapshot` + `externalLoading` +
 * `isEditMode` instead of `editData` (snapshot wins if both are set). Must
 * render inside a slide-in (injects SlideInRef; tests use ixFormTestingProviders()).
 *
 * Input surface is FROZEN: no new top-level inputs without team review — keep
 * outlier forms bespoke rather than grow this API.
 */
@Component({
  selector: 'ix-form',
  templateUrl: './ix-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    ReactiveFormsModule,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class IxFormComponent<T extends object = Record<string, unknown>> implements OnInit {
  // Input surface is FROZEN (see class JSDoc): no new top-level inputs without
  // team review; keep outlier forms bespoke.

  /** The reactive FormGroup this form manages. */
  readonly formGroup = input.required<FormGroup>();

  /**
   * Entity for edit mode (null = create); auto-patched in ngOnInit. Pass
   * Partial<T>, or a raw entity with `transformEditData`. For forms that patch
   * asynchronously themselves, use `initialFormSnapshot` instead.
   */
  readonly editData = input<Partial<T> | object | null | undefined>(null);

  /** Maps `editData` from entity shape to form shape before patching. */
  readonly transformEditData = input<((data: unknown) => Partial<T>) | null>(null);

  /** Initial snapshot for forms that do their own async setup/patching. */
  readonly initialFormSnapshot = input<Partial<T> | null>(null);

  /** Explicit title; overrides addTitle/editTitle. */
  readonly title = input<string>('');

  /** Create-mode title (when no explicit `title`). */
  readonly addTitle = input<string>('');

  /** Edit-mode title (when no explicit `title`). */
  readonly editTitle = input<string>('');

  /** Roles required to submit. */
  readonly requiredRoles = input<Role[]>([]);

  /**
   * Returns the API request + success message; the wrapper runs the lifecycle.
   * Type the handler as `(event: FormSubmitEvent<MyShape>) => SubmitResult` for
   * type safety — templates can't pass the generic.
   */
  readonly submitHandler = input.required<(event: FormSubmitEvent<T>) => SubmitResult>();

  /** Hook before submitHandler: return a modified event, or `false` to cancel. */
  readonly preSubmit = input<((event: FormSubmitEvent<T>) => FormSubmitEvent<T> | false) | null>(null);

  /** Fires when destroyed without a successful submit (cancel/escape/swap). */
  readonly onCancel = input<(() => void) | null>(null);

  /** External loading (async setup); ORed into isLoading. */
  readonly externalLoading = input(false);

  /** Edit-mode override; inference treats any non-null editData (incl. `{}`) as edit. */
  readonly isEditMode = input<boolean | null>(null);

  /** Keep Save disabled (and ignore Enter) while pristine. */
  readonly requireDirty = input(false);

  /** Skip the success snackbar (config-builder forms); still closes + onSuccess. */
  readonly suppressSuccessSnackbar = input(false);

  /**
   * Extra disabled gate ORed with the built-in checks. Drive from a
   * signal/computed/input — a plain getter won't re-evaluate under OnPush.
   */
  readonly extraDisabled = input<boolean>(false);

  /**
   * Override the dirty-confirmation check (default: formGroup.dirty). Return
   * `of(false)` to never prompt; re-invoked on each check.
   */
  readonly dirtyPredicate = input<(() => Observable<boolean>) | null>(null);

  /** Submit-only loading. Consumer-stable (read via template ref). */
  readonly isSubmitting = signal(false);

  /** Submit OR externalLoading. Consumer-stable. */
  readonly isLoading = computed(() => this.isSubmitting() || this.externalLoading());

  /**
   * Emitted on a successful submit when hosted OUTSIDE a SlideIn (i.e. inside a
   * `<tn-side-panel>`, where {@link slideInRef} is absent). The host listens to
   * close its panel and reload. In SlideIn mode this never fires — the slide-in
   * is closed directly via {@link slideInRef}.
   */
  readonly closed = output<boolean>();

  /**
   * Live form validity for hosts that own the Save action (the `<tn-side-panel>`
   * footer Save reads this through the wrapping form's `canSubmit`). Tracked as a
   * signal because `FormGroup.status` is not reactive under OnPush.
   */
  private readonly formStatus = signal<FormControlStatus>('INVALID');

  /**
   * True while the form may be submitted; drives a host-owned Save button (the `<tn-side-panel>`
   * footer). Mirrors {@link isSaveDisabled} — which gates the in-body SlideIn Save — so both hosts
   * enable Save under the same condition. Blocks only on `INVALID`, not `PENDING`: an edit form
   * runs its async validators (e.g. name/path uniqueness) against unchanged, already-valid data on
   * open, and gating on `=== 'VALID'` would leave Save disabled through that pending window (the
   * "Save disabled until I change something" on WebShare Edit). `form.invalid` is false while
   * PENDING, so the SlideIn Save stayed enabled there — match it.
   */
  readonly canSubmit = computed(
    () => this.formStatus() !== 'INVALID' && !this.isLoading() && !this.extraDisabled(),
  );

  private readonly internalSnapshot = signal<Partial<T> | null>(null);

  // Set on successful emit; read by the DestroyRef hook to gate onCancel.
  private hadSuccessfulSubmit = false;

  // Dev-only: ensures the nested-group changedValues warning fires at most once.
  private warnedNestedChangedValues = false;

  // Optional: present when hosted in a legacy SlideIn (the `<ix-modal-header>`
  // and in-form Save are gated on it). Absent inside a `<tn-side-panel>`, where
  // the host owns the header + Save and close happens via {@link closed}.
  protected slideInRef = inject<SlideInRef<unknown, unknown>>(SlideInRef, { optional: true });
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
    // `!= null` treats `editData={}` / empty snapshot as edit; override via isEditMode.
    return this.editData() != null || this.snapshot() != null;
  });

  /** Explicit title wins, else addTitle/editTitle by mode. */
  readonly resolvedTitle = computed(() => {
    return this.title() || (this.isEdit() ? this.editTitle() : this.addTitle());
  });

  /**
   * Single source for "Save blocked" (button [disabled] + Enter guard). A
   * method, not a computed: invalid/pristine aren't signals, so it must re-run
   * each CD pass.
   */
  protected isSaveDisabled(): boolean {
    const form = this.formGroup();
    return form.invalid
      || this.isLoading()
      || (this.requireDirty() && form.pristine)
      || this.extraDisabled();
  }

  /** Public entry point for a host (e.g. `<tn-side-panel>` footer) to submit. */
  submit(): void {
    this.onFormSubmit();
  }

  /** Whether the form has edits a host should confirm before discarding. */
  hasUnsavedChanges(): boolean {
    return this.formGroup().dirty;
  }

  ngOnInit(): void {
    // Track validity reactively for host-owned Save buttons (side-panel host).
    this.formGroup().statusChanges.pipe(
      startWith(this.formGroup().status),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((status) => this.formStatus.set(status));

    // `defer` keeps the read lazy and picks up a dirtyPredicate set after init.
    // No-op without a SlideIn host — the side-panel host guards discards itself.
    this.slideInRef?.requireConfirmationWhen(() => defer(() => {
      const predicate = this.dirtyPredicate();
      return predicate ? predicate() : of(this.formGroup().dirty);
    }));

    // onCancel fires on every non-success destroy path.
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
      // Defensive: patchValue doesn't mark dirty today, but a setValue swap would.
      this.formGroup().markAsPristine();
      this.internalSnapshot.set(this.formGroup().getRawValue() as Partial<T>);
    }
  }

  onFormSubmit(): void {
    // Enter fires ngSubmit even when Save is disabled — guard with the same predicate.
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
        this.finishClose(payload);
        // Reset after close so a sync-complete observable doesn't flash Save enabled.
        this.isSubmitting.set(false);
      },
      error: (error: unknown) => {
        this.isSubmitting.set(false);
        if (!onError?.(error)) {
          this.errorHandler.handleValidationErrors(error, this.formGroup());
        }
      },
      // Safety net: observables that complete without emitting (EMPTY) would
      // otherwise stick in submitting. Skip when next already reset.
      complete: () => {
        if (!handledSuccess) {
          this.isSubmitting.set(false);
        }
      },
    });
  }

  /**
   * Closes through whichever host opened the form. SlideIn host: closes the
   * slide-in with the payload (coercing `undefined`→`true` so a void-endpoint
   * success isn't read as a cancel). Side-panel host: emits {@link closed} so the
   * host tears down its panel; the payload isn't forwarded (the host reloads from
   * its own source / the submit's `onSuccess` already updated any store).
   */
  private finishClose(payload: unknown): void {
    if (!this.slideInRef) {
      this.closed.emit(true);
      return;
    }

    if (payload === undefined) {
      if (isDevMode()) {
        console.warn(
          '[ix-form] submitHandler close payload resolved to undefined (request$ emitted undefined '
          + 'and closeWith is absent or also returned undefined); slide-in will close with `true` so '
          + 'upstream listeners don\'t observe a cancel. Provide a closeWith that returns a defined '
          + 'value in SubmitResult to silence this warning.',
        );
      }
      this.slideInRef.close({ response: true });
    } else {
      this.slideInRef.close({ response: payload });
    }
  }

  private getChangedValues(current: T): Partial<T> {
    const snapshot = this.snapshot();
    const controls = this.formGroup().controls;

    if (isDevMode()) {
      this.warnNestedChangedValues(controls);
    }

    // Disabled controls (incl. ones hidden by visibleWhen/enabledWhen) are
    // omitted so a stale value the user can no longer see never reaches the diff.
    const isActive = (key: keyof T): boolean => !controls[key as string]?.disabled;

    if (!snapshot) {
      const all: Partial<T> = {};
      for (const key of Object.keys(current) as (keyof T)[]) {
        if (isActive(key)) {
          all[key] = current[key];
        }
      }
      return all;
    }

    const changed: Partial<T> = {};
    for (const key of Object.keys(current) as (keyof T)[]) {
      if (!isActive(key)) {
        continue;
      }
      if (!(key in snapshot) || !isEqual(current[key], snapshot[key])) {
        changed[key] = current[key];
      }
    }
    return changed;
  }

  /**
   * Dev-only guard. `changedValues` diffs per top-level key with a shallow deep
   * equality, so a nested `FormGroup`/`FormArray` reports as a single whole-object
   * entry: change one inner control and the entire subtree lands in the payload.
   * That silently defeats a "send only what changed" submit, so warn the author
   * to build the payload from `allValues` (or diff the subtree themselves) for
   * those keys. Fires once per form instance.
   */
  private warnNestedChangedValues(controls: FormGroup['controls']): void {
    if (this.warnedNestedChangedValues) {
      return;
    }
    const nestedKeys = Object.keys(controls).filter(
      (key) => controls[key] instanceof FormGroup || controls[key] instanceof FormArray,
    );
    if (nestedKeys.length === 0) {
      return;
    }
    this.warnedNestedChangedValues = true;
    const quotedKeys = nestedKeys.map((key) => `"${key}"`).join(', ');
    console.warn(
      `[ix-form] changedValues diffs top-level keys shallowly, but ${quotedKeys} `
      + `${nestedKeys.length === 1 ? 'is a' : 'are'} nested FormGroup/FormArray. Editing any inner control makes the `
      + 'whole subtree appear changed, so a "send only changed" payload would send all of it. Build the payload from '
      + '`allValues` (or diff the subtree yourself) for those keys instead of relying on `changedValues`.',
    );
  }
}
