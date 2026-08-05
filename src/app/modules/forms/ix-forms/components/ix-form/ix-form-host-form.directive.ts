import {
  computed, DestroyRef, Directive, effect, inject, output, signal, viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup } from '@angular/forms';
import { Observable, Subscription, take } from 'rxjs';
import { IxFormComponent, IxFormLoadState } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { SidePanelHostForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

/**
 * Base for a side-panel form that WRAPS an inner `<ix-form>` and delegates the host surface to it,
 * rather than being the form itself (that self-contained shape is {@link SidePanelForm}). It holds
 * the `<ix-form>` view query and re-exposes its submit / validity / dirty state so
 * `FormSidePanelService` and its container can drive the panel Save and unsaved-changes guard.
 *
 * Centralizes the four-member surface (`closed` / `hasUnsavedChanges` / `canSubmit` / `submit`) that
 * every `<ix-form>`-wrapping migration otherwise re-implements by hand, plus the config-load state
 * that {@link loadFormConfig} owns. Because it satisfies {@link SidePanelHostForm}, subclasses can
 * be handed to `open()` by their real type — no `as unknown as Type<SidePanelForm>` cast.
 *
 * Subclasses render exactly one `<ix-form>` in their template and forward its `closed` to
 * {@link closed} (`(closed)="closed.emit($event)"`), or emit a richer payload from their own close
 * handler when `R` is not `boolean`. The load state reaches that `<ix-form>` through the view query
 * below — a config form's template carries no load-state bindings of its own.
 *
 * @typeParam R success payload emitted through {@link closed} (defaults to `boolean`).
 * @typeParam V the {@link form}'s raw value shape, which types {@link initialFormSnapshot} so it
 * lines up with the `<ix-form>` it is bound to. Passed explicitly (rather than derived from
 * `this['form']`) so {@link form} can stay `protected` — an indexed access can only reach a public
 * member. Forms that don't bind `initialFormSnapshot` can leave it at the default.
 *
 * Deriving `V` therefore can't go through the component either, which is why the config forms
 * build their group in a module-level factory and read the shape off that:
 *
 * ```ts
 * // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
 * function createFooForm(fb: FormBuilder) { return fb.group({ … }); }
 * type FooFormValue = ReturnType<ReturnType<typeof createFooForm>['getRawValue']>;
 *
 * export class FooComponent extends IxFormHostForm<boolean, FooFormValue> { … }
 * ```
 *
 * The factory's return type is deliberately left inferred (hence the lint suppression): the
 * inferred `FormGroup` IS the contract the alias reads, and writing it out would restate every
 * control.
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

  /** The form group the subclass renders inside its `<ix-form>`. */
  protected abstract readonly form: FormGroup;

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
   * Everything {@link loadFormConfig} tracks, in the shape `<ix-form>` consumes.
   *
   * Pushed into the inner form through the view query this base already owns, rather than asked of
   * every subclass template as `[externalLoading]` + `[extraDisabled]` + `[initialFormSnapshot]`.
   * Those three bindings did nothing until they were written out, and omitting them failed SILENTLY
   * — the panel still showed its "settings could not be loaded" banner while Save stayed enabled
   * over the untouched defaults, which is the exact scenario {@link loadFailed} exists to prevent.
   * Wiring it here instead rides on the same `ixForm` query that already backs `submit()` /
   * `canSubmit()`, so there is no longer a partial state to get wrong: either the subclass renders
   * an `<ix-form>` and gets the whole contract, or it renders none and breaks loudly.
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
   * Runs a config form's initial load: raises {@link dataLoading}, hands the loaded value to
   * `patch` to populate the controls, then captures {@link initialFormSnapshot}. On failure — the
   * request erroring OR `patch` throwing — it reports the error and latches {@link loadFailed}, so
   * Save can never submit the defaults the user never saw.
   *
   * Re-entrant: any load still in flight is unsubscribed, and both {@link loadFailed} and the
   * snapshot are cleared, so a retry (or a second load) starts clean rather than racing the
   * previous attempt — a late stale response could otherwise re-latch a failure over a successful
   * retry. The arguments are kept so {@link retryLoad} can replay them.
   *
   * `patch` must therefore be IDEMPOTENT: it runs again on every retry, against a group that still
   * holds whatever the previous attempt left behind. `patchValue` is naturally re-runnable, but a
   * patch that PUSHES (e.g. a `FormArray` row per loaded item) has to clear the array first —
   * replaying it would otherwise come back with every row duplicated. The base can't reset the
   * group on its behalf: it knows neither the form's defaults nor which array rows were structure
   * rather than data.
   *
   * For the same reason `patch` is the wrong place to WIRE anything (a `valueChanges` subscription,
   * a validator): a replay would register it a second time. Set those up once, before the load.
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
          patch(config);
        } catch (error: unknown) {
          this.handleLoadFailure(error);
          return;
        }
        this.loadedSnapshot.set(this.form.getRawValue() as object);
        // Defensive, same guard `<ix-form>` applies after patching `editData`: no `patch` today
        // dirties the group (patchValue and FormArray.push both leave it pristine), but this is the
        // shared entry point for every config form, and `hasUnsavedChanges()` is just the group's
        // `dirty` — one that did would make the panel demand a discard confirmation on open.
        this.form.markAsPristine();
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
