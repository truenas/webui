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
  FormArray, FormControlStatus, FormGroup, ReactiveFormsModule,
} from '@angular/forms';
import { FieldTree } from '@angular/forms/signals';
import { isEqual } from 'lodash-es';
import { forkJoin, map, Observable, startWith, take, timer } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { SignalFormErrors } from 'app/modules/forms/signal-forms/signal-form-errors.service';
import { fieldAt, patchModelValue, toFormModel } from 'app/modules/forms/signal-forms/signal-forms.utils';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TranslatedString } from 'app/modules/translate/translate.helper';

/**
 * Default for {@link ixFormMinSubmitFeedbackMs}. Exported so a spec asserting the delay can
 * re-provide the real duration (and drive its `tick()`s from it) without restating the number.
 */
export const defaultMinSubmitFeedbackMs = 500;

/**
 * Minimum time (ms) the submitting indicator stays up after a successful save, so a fast local call
 * doesn't close the panel before the progress bar is seen. Errors surface immediately. Set to `0` to
 * skip the timer, as `ixFormTestingProviders()` does for specs that expect a synchronous close.
 */
export const ixFormMinSubmitFeedbackMs = new InjectionToken<number>('ixFormMinSubmitFeedbackMs', {
  providedIn: 'root',
  factory: () => defaultMinSubmitFeedbackMs,
});

export interface FormSubmitEvent<T = Record<string, unknown>> {
  /** Whether this form is in edit mode. */
  isEdit: boolean;

  /**
   * All current form values: `formGroup.getRawValue()`, or the whole model of a `[fieldTree]` form.
   * Either way it includes disabled fields, and for a signal form hidden ones too; see `activeValue()`.
   */
  allValues: T;

  /**
   * Top-level keys that differ from the initial snapshot (all of them on create), computed lazily.
   * Disabled controls (and a signal form's hidden fields) are excluded, so a hidden field's stale value
   * can't leak in. Nested groups report
   * as one whole entry; use `allValues` for those, paired or derived controls, or reshaped payloads.
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
   * Shapes the payload {@link IxFormComponent.closed} carries, which is how a panel-hosted form hands
   * the saved record to its opener; without it the output is a bare `true`. Only a TRUTHY payload counts
   * as a save, so never return `0`, `''`, `null` or `false` (see `FormSidePanelService.open`).
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
 * Form wrapper owning change tracking (snapshot + submit diff), loading and dirty confirmation, and the
 * submit lifecycle; the `<tn-side-panel>` host owns the header and Save. For async setup, use
 * `initialFormSnapshot` + `externalLoading` + `isEditMode` instead of `editData`. Projected controls
 * resolve the consumer's `FormGroupDirective`, not the inner `<form>`, so pass a child its group as an
 * input. The input surface is FROZEN: new inputs need team review. Tests use `ixFormTestingProviders()`.
 * Takes `[formGroup]` or a signal form's `[fieldTree]` (see `docs/devs/signal-forms.md`), never both.
 */
@Component({
  selector: 'ix-form',
  templateUrl: './ix-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
  ],
})
export class IxFormComponent<
  T extends object = Record<string, unknown>,
  R = boolean,
  TResult = unknown,
> implements OnInit {
  // Input surface is FROZEN (see class JSDoc): no new top-level inputs without
  // team review; keep outlier forms bespoke.

  /** The reactive FormGroup this form manages. Exactly one of this and {@link fieldTree} is set. */
  readonly formGroup = input<FormGroup | null>(null);

  /**
   * The signal form (the result of `form()`) this form manages, instead of a {@link formGroup}. Added to
   * the frozen surface in NAS-145112 as the one input the signal path needs. Infers `T`, so the submit
   * handler sees the model's own type.
   */
  readonly fieldTree = input<FieldTree<T> | null>(null);

  /** {@link fieldTree}, typed for the helpers that walk any model. */
  private readonly anyFieldTree = computed(() => this.fieldTree() as unknown as FieldTree<unknown> | null);

  /**
   * What the inner `<form>` binds: the form's own group, or an empty one on the signal path, which keeps
   * `ngSubmit` (Enter to save) without a Reactive control in sight.
   */
  protected readonly hostGroup = computed(() => this.formGroup() ?? this.emptyGroup);

  private readonly emptyGroup = new FormGroup({});

  /** {@link formGroup} on the Reactive path, where `ngOnInit` has checked it is set. */
  private reactiveGroup(): FormGroup {
    return this.formGroup() as FormGroup;
  }

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

  /*
   * NOT RENDERED. The title inputs and `requiredRoles` only fed the legacy SlideIn header; the
   * `<tn-side-panel>` host takes its title from `FormSidePanelService.open()` and its roles from the
   * page. Kept because ~30 templates bind them and the input surface is frozen. Don't build on them;
   * remove them and their bindings together once the team reviews it.
   */

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

  /** Skip the success snackbar (config-builder forms); still closes + onSuccess. */
  readonly suppressSuccessSnackbar = input(false);

  /**
   * Extra disabled gate ORed with the built-in checks. Drive from a
   * signal/computed/input — a plain getter won't re-evaluate under OnPush.
   */
  readonly extraDisabled = input<boolean>(false);

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
   * Emitted on a successful submit. The `<tn-side-panel>` host listens to close its panel
   * and reload.
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
   * True while the form may be submitted; drives the host-owned Save button (the `<tn-side-panel>`
   * footer). Blocks only on `INVALID`, not `PENDING`: an edit form runs its async validators (e.g.
   * name/path uniqueness) against unchanged, already-valid data on open, and gating on
   * `=== 'VALID'` would leave Save disabled through that pending window (the "Save disabled until I
   * change something" on WebShare Edit).
   */
  readonly canSubmit = computed(
    () => !this.isInvalid() && !this.isLoading() && !this.isExtraDisabled(),
  );

  /**
   * Blocks on errors only, not on pending async validators, on both paths: `invalid()` on a field tree
   * is false while validators are only pending, like `status !== 'INVALID'` on a group.
   */
  private isInvalid(): boolean {
    const tree = this.anyFieldTree();
    return tree ? tree().invalid() : this.formStatus() === 'INVALID';
  }

  private readonly internalSnapshot = signal<Partial<T> | null>(null);

  // Set on successful emit; read by the DestroyRef hook to gate onCancel.
  private hadSuccessfulSubmit = false;

  // Dev-only: ensures the nested-group changedValues warning fires at most once.
  private warnedNestedChangedValues = false;

  private minSubmitFeedbackMs = inject(ixFormMinSubmitFeedbackMs);
  private errorHandler = inject(FormErrorHandlerService);
  private signalErrors = inject(SignalFormErrors, { optional: true });
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

  /**
   * Explicit title wins, else addTitle/editTitle by mode.
   *
   * NOT RENDERED — read only by specs since `<ix-modal-header>` was removed. See the note on
   * {@link title}.
   */
  readonly resolvedTitle = computed(() => {
    return this.title() || (this.isEdit() ? this.editTitle() : this.addTitle());
  });

  /**
   * Single source for "Save blocked" (button [disabled] + Enter guard). A
   * method, not a computed: invalid/pristine aren't signals, so it must re-run
   * each CD pass.
   */
  protected isSaveDisabled(): boolean {
    const tree = this.anyFieldTree();
    return (tree ? tree().invalid() : this.reactiveGroup().invalid)
      || this.isLoading()
      || this.isExtraDisabled();
  }

  /** Public entry point for a host (e.g. `<tn-side-panel>` footer) to submit. */
  submit(): void {
    this.onFormSubmit();
  }

  /** Whether the form has edits a host should confirm before discarding. */
  hasUnsavedChanges(): boolean {
    const tree = this.anyFieldTree();
    return tree ? tree().dirty() : this.reactiveGroup().dirty;
  }

  ngOnInit(): void {
    const tree = this.anyFieldTree();
    if (!tree === !this.formGroup()) {
      throw new Error('<ix-form> needs exactly one of [formGroup] and [fieldTree].');
    }
    if (tree) {
      this.signalErrors?.connect(tree);
    } else {
      // Track validity reactively for host-owned Save buttons (side-panel host).
      this.reactiveGroup().statusChanges.pipe(
        startWith(this.reactiveGroup().status),
        takeUntilDestroyed(this.destroyRef),
      ).subscribe((status) => this.formStatus.set(status));
    }

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
      if (tree) {
        this.patchModel(tree, patchData);
        return;
      }
      this.reactiveGroup().patchValue(patchData);
      // Defensive: patchValue doesn't mark dirty today, but a setValue swap would.
      this.reactiveGroup().markAsPristine();
      this.internalSnapshot.set(this.reactiveGroup().getRawValue() as Partial<T>);
    }
  }

  /**
   * `patchValue` for a model (see `patchModelValue`): deep, only keys the model has. Copied first, because
   * `editData` is often frozen store state (see `toFormModel`).
   */
  private patchModel(tree: FieldTree<unknown>, patch: Partial<T>): void {
    const state = tree();
    state.value.set(patchModelValue(state.value(), toFormModel(patch)));
    state.reset();
    this.internalSnapshot.set(toFormModel(state.value()) as Partial<T>);
  }

  onFormSubmit(): void {
    // Enter fires ngSubmit even when Save is disabled — guard with the same predicate.
    if (this.isSaveDisabled()) {
      return;
    }

    const tree = this.anyFieldTree();
    // A copy on both paths, so a handler reshaping `allValues` in place can't reach past the model's signals.
    const allValues = (tree ? toFormModel(tree().value()) : this.reactiveGroup().getRawValue()) as T;

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
    // Pair the request with a minimum-duration timer so a fast save still shows the panel's
    // progress bar / dim overlay long enough to register. `forkJoin` waits for BOTH to complete, so
    // success is handled at `max(request duration, min)`; a request error rejects `forkJoin`
    // immediately, so failures are never artificially delayed. A `0` min opts out (specs asserting a
    // synchronous close rely on that).
    const holdForFeedback = this.minSubmitFeedbackMs > 0;
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
        if (onError?.(error)) {
          return;
        }
        if (!tree) {
          this.errorHandler.handleValidationErrors(error, this.reactiveGroup());
        } else if (this.signalErrors) {
          this.signalErrors.handleValidationErrors(error);
        } else {
          // No way to pin anything on a signal form without the service; every field error goes to the
          // modal, which is still better than dropping it.
          this.errorHandler.handleValidationErrors(error, this.emptyGroup);
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
   * Closes the panel, handing back whatever `closeWith` shaped, defaulting to `true` — with no
   * `closeWith` there is nothing typed to forward, and the host reloads from its own source anyway.
   */
  private finishClose(result: TResult, closeWith?: (result: TResult) => R): void {
    // `SubmitResult` makes `closeWith` mandatory unless `R` admits `boolean`, so reaching this
    // without one means `R` is (or includes) `boolean` and `true` is a valid payload. The cast only
    // exists because TS can't narrow `R` from the absent property.
    this.closed.emit(closeWith ? closeWith(result) : (true as R & boolean));
  }

  private getChangedValues(current: T): Partial<T> {
    const snapshot = this.snapshot();
    const isActive = this.activeKeyPredicate();

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
   * Whether a top-level key belongs in `changedValues`. Disabled controls (incl. ones hidden by
   * visibleWhen/enabledWhen), and a signal form's hidden or disabled fields, are left out so a stale
   * value the user can no longer see never reaches the diff.
   */
  private activeKeyPredicate(): (key: keyof T) => boolean {
    const tree = this.anyFieldTree();
    if (tree) {
      return (key) => {
        const field = fieldAt(tree, [key as string]);
        return !field || (!field().hidden() && !field().disabled());
      };
    }

    const controls = this.reactiveGroup().controls;
    if (isDevMode()) {
      this.warnNestedChangedValues(controls);
    }
    return (key) => !controls[key as string]?.disabled;
  }

  /**
   * Dev-only warning: `changedValues` diffs top-level keys, so a nested `FormGroup`/`FormArray` lands
   * whole in the payload when one inner control changes, defeating a "send only what changed" submit.
   * Fires once per form, and only when a submit reads `changedValues`.
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
