import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  InjectionToken,
  input,
  isDevMode,
  OnInit,
  output,
  Signal,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl, FormArray, FormControlStatus, FormGroup, ReactiveFormsModule,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { isEqual } from 'lodash-es';
import {
  defer, forkJoin, map, Observable, of, startWith, take, timer,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import {
  FormErrorHandlerService, manualValidateErrorKey,
} from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TranslatedString } from 'app/modules/translate/translate.helper';

/**
 * Default for {@link ixFormMinSubmitFeedbackMs}. Exported so a spec asserting the delay can
 * re-provide the real duration (and drive its `tick()`s from it) without restating the number.
 */
export const defaultMinSubmitFeedbackMs = 500;

/**
 * Minimum time (ms) the submitting indicator stays up on a successful `<tn-side-panel>`-hosted save.
 * A local API call can resolve in a few ms, closing the panel before the host's progress bar / dim
 * overlay are perceptible — the save reads as if nothing happened. Holding success handling
 * (snackbar + close) until at least this long has elapsed guarantees the loader is actually seen.
 * Only the success path waits; errors surface immediately (see {@link IxFormComponent.onFormSubmit}).
 *
 * Injectable so specs that assert a synchronous close can set it to `0` (which skips the timer
 * entirely, restoring the un-delayed path); `ixFormTestingProviders()` does this by default.
 */
export const ixFormMinSubmitFeedbackMs = new InjectionToken<number>('ixFormMinSubmitFeedbackMs', {
  providedIn: 'root',
  factory: () => defaultMinSubmitFeedbackMs,
});

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
   *
   * Computed on first access (and cached), so leaving it unread costs nothing.
   */
  changedValues: Partial<T>;
}

/**
 * Shared shape of a submit descriptor. Consumers write {@link SubmitResult}, which layers the
 * "`closeWith` is mandatory once `R` isn't boolean" rule on top of this.
 *
 * @typeParam R payload the form closes with (see {@link SubmitResult.closeWith}).
 * @typeParam TResult what `request$` emits; types all three callbacks.
 */
interface SubmitResultBase<R, TResult> {
  request$: Observable<TResult>;

  /**
   * Success snackbar text — a string, or a function of the request result for a confirmation that
   * names the saved record.
   *
   * Required, but nullable: pass `null` — visibly, at the callsite — for a form that reports success
   * itself under `[suppressSuccessSnackbar]`. A `null` without that input is a silent save and warns
   * in dev mode; a function that returns `null` (e.g. the success path navigates away) is a
   * per-result decision and never warns.
   */
  successMessage: TranslatedString | ((result: TResult) => TranslatedString | null) | null;

  /** Runs after success, before close (store/navigation fire pre-animation). */
  onSuccess?: (result: TResult) => void;

  /** Return true if handled, to skip the default form error handler. */
  onError?: (error: unknown) => boolean;

  /**
   * Shapes the payload the form closes with. The SlideIn host closes the slide-in with it
   * (default: the raw request$ result; an `undefined` is coerced to `true` since SlideInResponse
   * reads `undefined` as a cancel). The `<tn-side-panel>` host emits it through
   * {@link IxFormComponent.closed}, which is how a panel-hosted form hands the saved record back
   * to its opener — without it that output carries a bare `true`.
   *
   * IMPORTANT — under the `<tn-side-panel>` host, only a TRUTHY payload counts as a save; never
   * return `0`, `''`, `null` or `false` to mean one. `FormSidePanelService.open` documents the
   * rule and owns the coercion.
   */
  closeWith?: (result: TResult) => R;
}

/**
 * Descriptor a `submitHandler` returns: the request plus how to report and close.
 *
 * `closeWith` is optional only while `R` admits `boolean` — declare a richer `R` and the compiler
 * demands one, so a form can't promise its opener a record and silently deliver `true`.
 *
 * @typeParam R payload the form closes with; defaults to `boolean` ("saved", nothing to hand back).
 * @typeParam TResult what `request$` emits — types `onSuccess`/`closeWith`'s argument.
 */
export type SubmitResult<R = boolean, TResult = unknown> = boolean extends R
  ? SubmitResultBase<R, TResult>
  : SubmitResultBase<R, TResult> & { closeWith: (result: TResult) => R };

/**
 * Config-load state a wrapping `IxFormHostForm` hands to the `<ix-form>` it renders, covering the
 * same ground as the {@link IxFormComponent.externalLoading} / {@link IxFormComponent.extraDisabled}
 * / {@link IxFormComponent.initialFormSnapshot} inputs. Pushed through
 * {@link IxFormComponent.connectLoadState} rather than bound in the subclass's template, so the
 * three-part contract can't be half-written — see the directive for the full rationale.
 */
export interface IxFormLoadState {
  /** True while the host's initial config load is in flight (as `externalLoading`). */
  loading: boolean;

  /** True once that load has failed, which must block Save over defaults the user never saw. */
  failed: boolean;

  /** Baseline captured after a successful load, which `changedValues` diffs against. */
  snapshot: object | null;
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
 * `isEditMode` instead of `editData` (snapshot wins if both are set).
 *
 * Projected controls resolve their `ControlContainer` in the CONSUMER's view — from the
 * `FormGroupDirective` that `[formGroup]` puts on the `<ix-form>` element via the consumer's own
 * `ReactiveFormsModule` import. The inner `<form>` below is NOT in that chain (it exists to give
 * `ngSubmit`), so it never serves projected content. A child component that holds some of the
 * fields therefore can't inherit the container across the projection boundary: hand it the group as
 * an input and let it bind `[formGroup]` in its own template.
 *
 * Hosts either way: inside a legacy slide-in (injects `SlideInRef`, closed directly
 * through it) or host-less inside a `<tn-side-panel>` (`SlideInRef` is `{ optional: true }`
 * and absent — the {@link closed} output drives the panel to close and reload). Tests use
 * `ixFormTestingProviders()`.
 *
 * Input surface is FROZEN: no new top-level inputs without team review — keep
 * outlier forms bespoke rather than grow this API.
 *
 * @typeParam T form value shape
 * @typeParam R payload {@link closed} carries in the side-panel host; inferred from the
 *   `submitHandler`'s {@link SubmitResult} and defaulting to `boolean`.
 * @typeParam TResult what the handler's `request$` emits; inferred alongside `R`.
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
export class IxFormComponent<
  T extends object = Record<string, unknown>,
  R = boolean,
  TResult = unknown,
> implements OnInit {
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
  readonly submitHandler = input.required<(event: FormSubmitEvent<T>) => SubmitResult<R, TResult>>();

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

  // Wired once by a wrapping `IxFormHostForm`; absent (null) under every other host.
  private readonly loadStateSource = signal<Signal<IxFormLoadState> | null>(null);

  private readonly loadState = computed<IxFormLoadState | null>(() => this.loadStateSource()?.() ?? null);

  /**
   * Hands this form the config-load state of the `IxFormHostForm` that renders it. Called by the
   * directive through the view query it already owns — NOT an input, because the whole point is
   * that no subclass template has to remember to bind it.
   */
  connectLoadState(state: Signal<IxFormLoadState>): void {
    this.loadStateSource.set(state);
  }

  /** Submit-only loading. Consumer-stable (read via template ref). */
  readonly isSubmitting = signal(false);

  /** Submit OR externalLoading (or a wrapping host's config load). Consumer-stable. */
  readonly isLoading = computed(
    () => this.isSubmitting() || this.externalLoading() || (this.loadState()?.loading ?? false),
  );

  /** {@link extraDisabled}, plus a wrapping host's failed config load. */
  private readonly isExtraDisabled = computed(() => this.extraDisabled() || (this.loadState()?.failed ?? false));

  /**
   * Emitted on a successful submit when hosted OUTSIDE a SlideIn (i.e. inside a
   * `<tn-side-panel>`, where {@link slideInRef} is absent). The host listens to
   * close its panel and reload. In SlideIn mode this never fires — the slide-in
   * is closed directly via {@link slideInRef}.
   *
   * Carries the payload from the submit's {@link SubmitResult.closeWith}, so a host whose opener
   * needs the saved record can forward it straight through; without a `closeWith` it is a bare
   * `true` (and `R` stays `boolean`). Note `FormSidePanelService` reads a FALSY payload here as a
   * cancel — see the caveat on `SubmitResult.closeWith`.
   */
  readonly closed = output<R>();

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
    () => this.formStatus() !== 'INVALID' && !this.isLoading() && !this.isExtraDisabled(),
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
  private minSubmitFeedbackMs = inject(ixFormMinSubmitFeedbackMs);
  private errorHandler = inject(FormErrorHandlerService);
  private snackbar = inject(SnackbarService);
  private destroyRef = inject(DestroyRef);

  private readonly snapshot = computed<Partial<T> | null>(() => {
    return this.initialFormSnapshot() ?? (this.loadState()?.snapshot as Partial<T> | null) ?? this.internalSnapshot();
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
      || this.isExtraDisabled();
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

    // A backend validation failure is pinned onto its control with `setErrors()`, so — unlike a
    // validator result — it never re-evaluates. Angular drops it when THAT control changes, but an
    // error the user is meant to answer from a DIFFERENT field (ticking `Force` for an NTP address
    // the server could not reach) would stay pinned forever, leaving Save disabled with no way out
    // but re-editing the flagged field. Discard pinned errors on the next edit anywhere in the
    // form: each described one submission's payload, and the payload has moved on. If the verdict
    // still stands, the next save pins it again.
    this.formGroup().valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.dropPinnedServerErrors());

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

    // `changedValues` is diffed on first read and cached, so a handler that builds its payload from
    // `allValues` pays neither the diff nor the nested-group advisory — which only matter to
    // handlers that actually consume the diff.
    let changed: Partial<T> | undefined;
    const readChangedValues = (): Partial<T> => {
      changed ??= this.getChangedValues(allValues);
      return changed;
    };
    const event: FormSubmitEvent<T> = {
      isEdit: this.isEdit(),
      allValues,
      get changedValues(): Partial<T> {
        return readChangedValues();
      },
    };

    // Read through the base shape: `SubmitResult`'s conditional only tightens `closeWith` for
    // callers, and stays unresolved while `R` is still a type parameter here.
    const {
      request$, successMessage, onSuccess, onError, closeWith,
    }: SubmitResultBase<R, TResult> = this.submitHandler()(event);

    this.isSubmitting.set(true);
    let handledSuccess = false;
    // In a `<tn-side-panel>` host, pair the request with a minimum-duration timer so a fast save
    // still shows the panel's progress bar / dim overlay long enough to register. `forkJoin` waits
    // for BOTH to complete, so success is handled at `max(request duration, min)`; a request error
    // rejects `forkJoin` immediately, so failures are never artificially delayed. The legacy SlideIn
    // host renders its own inline chrome (no host loader to hold), so it keeps the un-delayed path —
    // as does a `0` min (specs asserting a synchronous close opt out that way).
    const holdForFeedback = !this.slideInRef && this.minSubmitFeedbackMs > 0;
    const submit$ = holdForFeedback
      ? forkJoin([request$.pipe(take(1)), timer(this.minSubmitFeedbackMs)]).pipe(map(([result]) => result))
      : request$.pipe(take(1));
    submit$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (result: TResult) => {
        handledSuccess = true;
        this.hadSuccessfulSubmit = true;
        if (!this.suppressSuccessSnackbar()) {
          const message = typeof successMessage === 'function' ? successMessage(result) : successMessage;
          if (message) {
            this.snackbar.success(message);
          } else if (successMessage === null && isDevMode()) {
            // Only a statically `null` successMessage warns — a function that returned `null` chose
            // silence for this particular result, which is a supported outcome.
            console.warn(
              '[ix-form] submitHandler returned a null successMessage and suppressSuccessSnackbar is not '
              + 'set, so this save gives the user no confirmation. Provide a successMessage, or set '
              + '[suppressSuccessSnackbar] if the form reports success some other way.',
            );
          }
        }
        onSuccess?.(result);
        this.finishClose(result, closeWith);
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
   * Closes through whichever host opened the form, handing back whatever `closeWith` shaped.
   * SlideIn host: closes the slide-in with it (coercing `undefined`→`true` so a void-endpoint
   * success isn't read as a cancel), defaulting to the raw request result. Side-panel host: emits
   * it through {@link closed}, defaulting to `true` — with no `closeWith` there is nothing typed
   * to forward, and the host reloads from its own source anyway.
   */
  private finishClose(result: TResult, closeWith?: (result: TResult) => R): void {
    if (!this.slideInRef) {
      // `SubmitResult` makes `closeWith` mandatory unless `R` admits `boolean`, so reaching this
      // branch without one means `R` is (or includes) `boolean` and `true` is a valid payload.
      // The cast only exists because TS can't narrow `R` from the absent property.
      this.closed.emit(closeWith ? closeWith(result) : (true as R & boolean));
      return;
    }

    const payload = closeWith ? closeWith(result) : result;
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

  /**
   * Re-runs the validators of every control still carrying a pinned server error, which replaces
   * the pinned error with the control's real validation state (an empty required field stays
   * invalid — it just goes back to saying so for the right reason).
   *
   * `emitEvent: false` keeps the recompute out of `valueChanges`, which would re-enter this
   * handler, while still propagating the new status up the group. That silences `statusChanges`
   * too, so {@link formStatus} — which a `<tn-side-panel>` host's Save reads through `canSubmit` —
   * is refreshed by hand.
   */
  private dropPinnedServerErrors(): void {
    const form = this.formGroup();
    const pinned: AbstractControl[] = [];
    const collect = (control: AbstractControl): void => {
      if (control.errors?.[manualValidateErrorKey]) {
        pinned.push(control);
      }
      const children = (control as FormGroup | FormArray).controls;
      if (children) {
        Object.values(children).forEach(collect);
      }
    };
    collect(form);

    if (!pinned.length) {
      return;
    }
    pinned.forEach((control) => control.updateValueAndValidity({ emitEvent: false }));
    this.formStatus.set(form.status);
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
   * those keys. Fires once per form instance, and only from a submit that actually
   * reads `changedValues` — a form that already builds from `allValues` is doing
   * the right thing and stays quiet.
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
