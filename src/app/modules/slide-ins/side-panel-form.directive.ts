import {
  computed, Directive, inject, output, Signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl } from '@angular/forms';
import { of, startWith } from 'rxjs';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';

/**
 * Base class for any form that can be hosted either in a legacy SlideIn (via {@link SlideInRef})
 * or in a `<tn-side-panel>` (via the {@link closed} output and host-driven `submit()` /
 * `hasUnsavedChanges()` calls).
 *
 * Centralizes the unsaved-changes confirmation and close plumbing that is otherwise
 * duplicated across every side-panel form. Subclasses provide the {@link form} and
 * {@link onSubmit} implementation, and call {@link trackCanSubmit} to expose `canSubmit`.
 */
@Directive()
export abstract class SidePanelForm {
  /** Present when opened via legacy SlideIn host. Absent when hosted in `<tn-side-panel>`. */
  readonly slideInRef = inject<SlideInRef<unknown, boolean>>(SlideInRef, { optional: true });

  /** Emitted when the form should close (true = saved, false = cancelled). Only for `<tn-side-panel>` hosts. */
  readonly closed = output<boolean>();

  /** The form whose dirty/validity state drives confirmation and submission. */
  protected abstract readonly form: Pick<AbstractControl, 'dirty' | 'status' | 'statusChanges'>;

  /** Performs the actual save. Invoked by the host-facing {@link submit}. */
  protected abstract onSubmit(): void;

  constructor() {
    this.slideInRef?.requireConfirmationWhen(() => of(this.hasUnsavedChanges()));
  }

  /** Public entry point for hosts (e.g. `<tn-side-panel>`) to trigger form submission. */
  submit(): void {
    this.onSubmit();
  }

  /** Host hook (e.g. `<tn-side-panel>` closeGuard) to confirm before discarding unsaved edits. */
  hasUnsavedChanges(): boolean {
    return this.form.dirty;
  }

  /** Closes through whichever host opened the form. */
  protected close(saved: boolean): void {
    if (this.slideInRef) {
      this.slideInRef.close({ response: saved });
    } else {
      this.closed.emit(saved);
    }
  }

  /**
   * Builds the `canSubmit` signal from the form's validity and the given loading signal.
   * Call from a field initializer after {@link form} is assigned, e.g.
   * `protected readonly canSubmit = this.trackCanSubmit(this.isFormLoading);`
   */
  protected trackCanSubmit(isLoading: Signal<boolean>): Signal<boolean> {
    const status = toSignal(
      this.form.statusChanges.pipe(startWith(this.form.status)),
      { initialValue: this.form.status },
    );
    return computed(() => status() === 'VALID' && !isLoading());
  }
}
