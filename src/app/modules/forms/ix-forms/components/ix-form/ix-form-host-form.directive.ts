import { Directive, output, viewChild } from '@angular/core';
import { IxFormComponent } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { SidePanelHostForm } from 'app/modules/slide-ins/side-panel-form.directive';

/**
 * Base for a side-panel form that WRAPS an inner `<ix-form>` and delegates the host surface to it,
 * rather than being the form itself (that self-contained shape is {@link SidePanelForm}). It holds
 * the `<ix-form>` view query and re-exposes its submit / validity / dirty state so
 * `FormSidePanelService` and its container can drive the panel Save and unsaved-changes guard.
 *
 * Centralizes the four-member surface (`closed` / `hasUnsavedChanges` / `canSubmit` / `submit`) that
 * every `<ix-form>`-wrapping migration otherwise re-implements by hand. Because it satisfies
 * {@link SidePanelHostForm}, subclasses can be handed to `open()` by their real type — no
 * `as unknown as Type<SidePanelForm>` cast.
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

  /**
   * Emitted on a successful submit (or with the created record for a richer `R`) when hosted in a
   * `<tn-side-panel>`. Subclasses wire the inner `<ix-form>`'s `closed` to this in their template.
   */
  readonly closed = output<R>();

  /**
   * Whether the inner `<ix-form>` is currently submitting / loading. The host reads this (as
   * `HostedSidePanelForm.isBusy`) to show the panel's top progress bar during submit. Delegates to
   * the inner `<ix-form>` so every wrapped form gets the indicator for free.
   */
  isBusy(): boolean {
    return this.ixForm()?.isLoading() ?? false;
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
