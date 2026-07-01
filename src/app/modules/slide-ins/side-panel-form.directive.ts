import {
  computed, Directive, inject, output, Signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl } from '@angular/forms';
import { Observable, of, startWith } from 'rxjs';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { UnsavedChangesService } from 'app/modules/unsaved-changes/unsaved-changes.service';

/**
 * Base class for any form that can be hosted either in a legacy SlideIn (via {@link SlideInRef})
 * or in a `<tn-side-panel>` (via the {@link closed} output and host-driven `submit()` /
 * `hasUnsavedChanges()` calls).
 *
 * Centralizes the unsaved-changes confirmation and close plumbing that is otherwise
 * duplicated across every side-panel form. Subclasses provide the {@link form} and
 * {@link onSubmit} implementation, and call {@link trackCanSubmit} to expose `canSubmit`.
 *
 * The type parameter `R` is the success payload handed back to the opener: it defaults to
 * `boolean` (a plain "saved" signal, all most forms need). Forms that create a record the
 * caller needs — e.g. a picker's "Add New" — parameterize it (`SidePanelForm<User>`) and
 * emit the record through {@link closed}; `FormSidePanelService.open` then resolves with it.
 */
@Directive()
export abstract class SidePanelForm<R = boolean> {
  /** Present when opened via legacy SlideIn host. Absent when hosted in `<tn-side-panel>`. */
  readonly slideInRef = inject<SlideInRef<unknown, boolean>>(SlideInRef, { optional: true });

  /**
   * Emitted when the form should close. The success payload is `R` (defaults to `true` when
   * saved / `false` when cancelled); forms with a richer `R` emit the created record on save.
   * Only for `<tn-side-panel>` hosts.
   */
  readonly closed = output<R>();

  /** The form whose dirty/validity state drives confirmation and submission. */
  protected abstract readonly form: Pick<AbstractControl, 'dirty' | 'status' | 'statusChanges'>;

  /**
   * Whether the form can currently be submitted. Hosts (e.g. `<tn-side-panel>`)
   * read this to enable/disable their Save action. Build it with {@link trackCanSubmit}.
   */
  abstract readonly canSubmit: Signal<boolean>;

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

  /**
   * Closes through whichever host opened the form, emitting the boolean saved-signal. For the
   * default `R = boolean` this is exact; forms with a richer payload should call {@link closeWith}
   * with the created record instead.
   */
  protected close(saved: boolean): void {
    this.closeWith(saved as unknown as R);
  }

  /**
   * Closes through whichever host opened the form, handing back the full `R` payload. Use from
   * forms whose `R` is richer than `boolean` (e.g. a picker's "Add New" that returns the created
   * record) so the legacy SlideIn host is honored too — not just the `<tn-side-panel>` output.
   */
  protected closeWith(payload: R): void {
    if (this.slideInRef) {
      this.slideInRef.close({ response: payload as unknown as boolean });
    } else {
      this.closed.emit(payload);
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

/**
 * Builds a `<tn-side-panel>` `[closeGuard]` for a hosted {@link SidePanelForm}: prompts the
 * unsaved-changes confirmation when the form is dirty, otherwise allows the close. Centralizes
 * the guard otherwise duplicated across every side-panel host.
 *
 * @param unsavedChanges injected {@link UnsavedChangesService}
 * @param form accessor for the hosted form (typically a `viewChild` signal), may be absent
 *   while the panel is closed
 */
export function sidePanelFormCloseGuard(
  unsavedChanges: UnsavedChangesService,
  form: () => Pick<SidePanelForm, 'hasUnsavedChanges'> | undefined,
): () => Observable<boolean> {
  return () => (form()?.hasUnsavedChanges() ? unsavedChanges.showConfirmDialog() : of(true));
}
