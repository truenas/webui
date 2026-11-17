import {
  computed, DestroyRef, Directive, effect, inject, output, signal, viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup } from '@angular/forms';
import { FieldTree } from '@angular/forms/signals';
import { Observable, Subscription, take } from 'rxjs';
import { IxFormComponent, IxFormLoadState } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { isFieldTree, toFormModel } from 'app/modules/forms/signal-forms/signal-forms.utils';
import { SidePanelHostForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

/**
 * Base for a side-panel form that wraps one `<ix-form>` and delegates `closed` / `hasUnsavedChanges`
 * / `canSubmit` / `submit` to it (the self-contained shape is {@link SidePanelForm}). Subclasses forward
 * `(closed)` and get the config-load state from {@link loadFormConfig}. `V` is passed explicitly so
 * {@link form} can stay `protected`; config forms build their group in a module-level factory with an
 * inferred return type and read `V` off its `getRawValue`.
 */
@Directive()
export abstract class IxFormHostForm<R = boolean, V extends object = Record<string, unknown>>
implements SidePanelHostForm<R> {
  /** The inner `<ix-form>`, resolved once the subclass's view renders. */
  protected readonly ixForm = viewChild(IxFormComponent);

  // Prefixed so subclasses can keep declaring their own `destroyRef` / `errorHandler` injections —
  // a base member of the same name would clash with them.
  private readonly hostDestroyRef = inject(DestroyRef);
  private readonly hostErrorHandler = inject(ErrorHandlerService);

  /**
   * The form the subclass renders inside its `<ix-form>`: a `FormGroup` bound with `[formGroup]`, or a
   * signal form's field tree bound with `[fieldTree]`.
   */
  protected abstract readonly form: FormGroup | FieldTree<V>;

  /**
   * Emitted on a successful submit (or with the created record for a richer `R`) when hosted in a
   * `<tn-side-panel>`. Subclasses wire the inner `<ix-form>`'s `closed` to this in their template.
   */
  readonly closed = output<R>();

  /** True while {@link loadFormConfig} is in flight. Reaches `<ix-form>` as `externalLoading`. */
  protected readonly dataLoading = signal(false);

  /**
   * Latched when the initial config load fails, which leaves the form on untouched defaults the
   * user never saw. Reaches `<ix-form>` as `extraDisabled`, so Save (in-body and the panel footer's)
   * can't submit them. Cleared by a subsequent {@link loadFormConfig} — see its re-entrancy note.
   *
   * Also read by the `<tn-side-panel>` host (through {@link hasLoadFailed}) to explain the state:
   * once the one-shot error modal is dismissed there is nothing on screen saying why Save is
   * greyed out, so the container renders a banner offering {@link retryLoad}.
   */
  protected readonly loadFailed = signal(false);

  /**
   * Whether the initial config load failed. Host hook — `FormSidePanelContainerComponent` reads it
   * to show its "couldn't load" banner. Public because the host reads it off the instance.
   */
  hasLoadFailed(): boolean {
    return this.loadFailed();
  }

  private readonly loadedSnapshot = signal<object | null>(null);

  // The arguments of the most recent loadFormConfig call, replayed by retryLoad. The observable is
  // re-subscribed rather than rebuilt: `ApiService.call` is cold, so a fresh subscription issues a
  // fresh request.
  private lastLoad: { config$: Observable<unknown>; patch: (config: never) => void } | null = null;

  // The in-flight load, so a second loadFormConfig can cancel it rather than race it.
  private loadSubscription: Subscription | null = null;

  /**
   * Runs the last {@link loadFormConfig} again. Host hook — the container's load-failure banner
   * calls it, so a transient WebSocket hiccup on open no longer means closing and reopening the
   * panel. A no-op if no load has been started.
   */
  retryLoad(): void {
    if (this.lastLoad) {
      this.loadFormConfig(this.lastLoad.config$, this.lastLoad.patch);
    }
  }

  /**
   * The post-load baseline `<ix-form>` diffs `changedValues` against, captured by
   * {@link loadFormConfig}. Reaches `<ix-form>` as `initialFormSnapshot`. Typed as the subclass's
   * own `V`, so it lines up with the `<ix-form>` generic the same subclass's `submitHandler` pins.
   */
  protected initialFormSnapshot(): Partial<V> | null {
    return this.loadedSnapshot() as Partial<V> | null;
  }

  /**
   * The load state `<ix-form>` consumes, pushed in through the existing view query instead of three
   * template bindings per subclass. Omitting those bindings used to fail silently, leaving Save enabled
   * over unloaded defaults; now a subclass either renders an `<ix-form>` and gets the whole contract, or
   * breaks loudly.
   */
  private readonly loadState = computed<IxFormLoadState>(() => ({
    loading: this.dataLoading(),
    failed: this.loadFailed(),
    snapshot: this.initialFormSnapshot(),
  }));

  constructor() {
    // The view query settles on first render; hand the inner form its load state as soon as it does.
    effect(() => this.ixForm()?.connectLoadState(this.loadState));
  }

  /**
   * Runs a config form's initial load: raises {@link dataLoading}, passes the value to `patch`, then
   * captures {@link initialFormSnapshot}. If the request errors or `patch` throws, it latches
   * {@link loadFailed} so Save can't submit unseen defaults. A new call cancels the previous one and
   * {@link retryLoad} replays it, so `patch` must be idempotent (clear a `FormArray` before pushing rows)
   * and must not wire subscriptions or validators. A signal form's `patch` gets a copy (see `toFormModel`).
   */
  protected loadFormConfig<C>(config$: Observable<C>, patch: (config: C) => void): void {
    this.loadSubscription?.unsubscribe();
    this.lastLoad = { config$, patch: patch as (config: never) => void };
    this.loadFailed.set(false);
    this.loadedSnapshot.set(null);
    this.dataLoading.set(true);
    // `take(1)` enforces the single-emission contract the rest of this method assumes rather than
    // trusting every caller to pass a single-emit source: a second emission would re-run `patch`,
    // re-capture the snapshot and `markAsPristine()` over the user's in-progress edits. It also
    // makes the `complete` safety net's "completion always means the load is over" literally true.
    this.loadSubscription = config$.pipe(take(1), takeUntilDestroyed(this.hostDestroyRef)).subscribe({
      next: (config) => {
        try {
          // Wrapped so a throwing `patch` takes the same path as a failed request, instead of
          // escaping as an unhandled RxJS error that leaves the form enabled on defaults.
          patch(isFieldTree(this.form) ? toFormModel(config) : config);
        } catch (error: unknown) {
          this.handleLoadFailure(error);
          return;
        }
        this.captureLoadedForm();
        this.dataLoading.set(false);
      },
      error: (error: unknown) => this.handleLoadFailure(error),
      // Safety net, in the spirit of `IxFormComponent.onFormSubmit`: a source that completes
      // without emitting (EMPTY) would otherwise leave `dataLoading` stuck true — a permanent
      // panel progress bar and a Save that never enables. Unconditional because completion always
      // means the load is over, and the emit/error paths have already cleared the flag.
      complete: () => this.dataLoading.set(false),
    });
  }

  /**
   * Takes the post-load baseline and leaves the form pristine. Pristine is defensive, the same guard
   * `<ix-form>` applies after patching `editData`: no `patch` today dirties the form (patchValue,
   * FormArray.push and setting a model all leave it pristine), but this is the shared entry point for
   * every config form, and `hasUnsavedChanges()` is just `dirty` — one that did would make the panel
   * demand a discard confirmation on open.
   */
  private captureLoadedForm(): void {
    const form = this.form;
    if (form instanceof FormGroup) {
      this.loadedSnapshot.set(form.getRawValue() as object);
      form.markAsPristine();
      return;
    }
    this.loadedSnapshot.set(toFormModel(form().value()) as object);
    form().reset();
  }

  private handleLoadFailure(error: unknown): void {
    this.dataLoading.set(false);
    this.loadFailed.set(true);
    this.hostErrorHandler.showErrorModal(error);
  }

  /**
   * Whether the inner `<ix-form>` is currently submitting / loading. The host reads this (as
   * `HostedSidePanelForm.isBusy`) to show the panel's top progress bar during submit. Delegates to
   * the inner `<ix-form>` so every wrapped form gets the indicator for free.
   */
  isBusy(): boolean {
    // Answered from this base's own state as well as the inner form's, so the panel reflects the
    // config load from the moment it starts — the inner form only learns of it once the view query
    // has settled, one render later.
    return this.dataLoading() || (this.ixForm()?.isLoading() ?? false);
  }

  /**
   * Whether a save is actually in flight — distinct from {@link isBusy}, which also covers a form's
   * `externalLoading` (initial/background data load). The host reads this (as
   * `HostedSidePanelForm.isSubmitting`) to switch its Save to "Saving…", so a form merely loading
   * data never mislabels the button.
   */
  isSubmitting(): boolean {
    return this.ixForm()?.isSubmitting() ?? false;
  }

  /** Host hook (`<tn-side-panel>` closeGuard) to confirm before discarding unsaved edits. */
  hasUnsavedChanges(): boolean {
    return this.ixForm()?.hasUnsavedChanges() ?? false;
  }

  /**
   * Whether the form may be submitted right now. Delegates to the inner `<ix-form>`, gated on this
   * base's own load state for the same reason as {@link isBusy}: the panel footer's Save must never
   * be live over a config that is still loading, or that failed to.
   */
  canSubmit(): boolean {
    return !this.dataLoading() && !this.loadFailed() && (this.ixForm()?.canSubmit() ?? false);
  }

  /** Host entry point (`<tn-side-panel>` footer Save) to trigger submission. */
  submit(): void {
    this.ixForm()?.submit();
  }
}
