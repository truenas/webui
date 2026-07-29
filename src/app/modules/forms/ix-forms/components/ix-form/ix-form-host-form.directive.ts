import {
  DestroyRef, Directive, inject, output, signal, viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup } from '@angular/forms';
import { Observable } from 'rxjs';
import { IxFormComponent } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { SidePanelHostForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

/**
 * Base for a side-panel form that WRAPS an inner `<ix-form>` and delegates the host surface to it,
 * rather than being the form itself (that self-contained shape is {@link SidePanelForm}). It holds
 * the `<ix-form>` view query and re-exposes its submit / validity / dirty state so
 * `FormSidePanelService` and its container can drive the panel Save and unsaved-changes guard.
 *
 * Centralizes the four-member surface (`closed` / `hasUnsavedChanges` / `canSubmit` / `submit`) that
 * every `<ix-form>`-wrapping migration otherwise re-implements by hand, plus the config-load triple
 * ({@link dataLoading} / {@link loadFailed} / {@link initialFormSnapshot}) that a config form binds
 * to `<ix-form>` — see {@link loadFormConfig}. Because it satisfies {@link SidePanelHostForm},
 * subclasses can be handed to `open()` by their real type — no `as unknown as Type<SidePanelForm>`
 * cast.
 *
 * Subclasses render exactly one `<ix-form>` in their template and forward its `closed` to
 * {@link closed} (`(closed)="closed.emit($event)"`), or emit a richer payload from their own close
 * handler when `R` is not `boolean`.
 *
 * @typeParam R success payload emitted through {@link closed} (defaults to `boolean`).
 */
@Directive()
export abstract class IxFormHostForm<R = boolean> implements SidePanelHostForm<R> {
  /** The inner `<ix-form>`, resolved once the subclass's view renders. */
  protected readonly ixForm = viewChild(IxFormComponent);

  // Prefixed so subclasses can keep declaring their own `destroyRef` / `errorHandler` injections —
  // a base member of the same name would clash with them.
  private readonly hostDestroyRef = inject(DestroyRef);
  private readonly hostErrorHandler = inject(ErrorHandlerService);

  /**
   * The form group the subclass renders inside its `<ix-form>`. Public rather than protected
   * because {@link initialFormSnapshot} types itself off it (`this['form']`), which TypeScript
   * only permits for a public member.
   */
  abstract readonly form: FormGroup;

  /**
   * Emitted on a successful submit (or with the created record for a richer `R`) when hosted in a
   * `<tn-side-panel>`. Subclasses wire the inner `<ix-form>`'s `closed` to this in their template.
   */
  readonly closed = output<R>();

  /** True while {@link loadFormConfig} is in flight. Bind to `<ix-form>`'s `externalLoading`. */
  protected readonly dataLoading = signal(false);

  /**
   * Latched when the initial config load fails, which leaves the form on untouched defaults the
   * user never saw. Bind to `<ix-form>`'s `extraDisabled` so Save (in-body and the panel footer's)
   * can't submit them.
   */
  protected readonly loadFailed = signal(false);

  private readonly loadedSnapshot = signal<object | null>(null);

  /**
   * The post-load baseline `<ix-form>` diffs `changedValues` against, captured by
   * {@link loadFormConfig}. Bind to `<ix-form>`'s `initialFormSnapshot`. Typed through `this`, so
   * each subclass sees its own form's raw value shape without re-declaring the signal.
   */
  protected initialFormSnapshot(): Partial<ReturnType<this['form']['getRawValue']>> | null {
    return this.loadedSnapshot() as Partial<ReturnType<this['form']['getRawValue']>> | null;
  }

  /**
   * Runs a config form's initial load: raises {@link dataLoading}, hands the loaded value to
   * `patch` to populate the controls, then captures {@link initialFormSnapshot}. On failure it
   * reports the error and latches {@link loadFailed}, so Save can never submit the defaults the
   * user never saw.
   */
  protected loadFormConfig<V>(config$: Observable<V>, patch: (config: V) => void): void {
    this.dataLoading.set(true);
    config$.pipe(takeUntilDestroyed(this.hostDestroyRef)).subscribe({
      next: (config) => {
        patch(config);
        this.loadedSnapshot.set(this.form.getRawValue() as object);
        this.dataLoading.set(false);
      },
      error: (error: unknown) => {
        this.dataLoading.set(false);
        this.loadFailed.set(true);
        this.hostErrorHandler.showErrorModal(error);
      },
    });
  }

  /**
   * Whether the inner `<ix-form>` is currently submitting / loading. The host reads this (as
   * `HostedSidePanelForm.isBusy`) to show the panel's top progress bar during submit. Delegates to
   * the inner `<ix-form>` so every wrapped form gets the indicator for free.
   */
  isBusy(): boolean {
    return this.ixForm()?.isLoading() ?? false;
  }

  /**
   * Whether a save is actually in flight, as opposed to the initial data load that also trips
   * {@link isBusy}. The host reads this (as `HostedSidePanelForm.isSubmitting`) to flip the panel's
   * Save to "Saving…", so a slow config load never mislabels the button.
   */
  isSubmitting(): boolean {
    return this.ixForm()?.isSubmitting() ?? false;
  }

  /** Host hook (`<tn-side-panel>` closeGuard) to confirm before discarding unsaved edits. */
  hasUnsavedChanges(): boolean {
    return this.ixForm()?.hasUnsavedChanges() ?? false;
  }

  /** Whether the form may be submitted right now. Delegates to the inner `<ix-form>`. */
  canSubmit(): boolean {
    return this.ixForm()?.canSubmit() ?? false;
  }

  /** Host entry point (`<tn-side-panel>` footer Save) to trigger submission. */
  submit(): void {
    this.ixForm()?.submit();
  }
}
