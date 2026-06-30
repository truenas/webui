import {
  computed, Directive, effect, inject, output, signal, Signal,
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

  /** Loading signal backing {@link isBusy}; captured from {@link trackCanSubmit} (false otherwise). */
  private submitLoading: Signal<boolean> = signal(false);

  /**
   * Set by {@link submit} and cleared once the busy period it kicked off settles (see the
   * falling-edge reset in the constructor); gates {@link isSubmitting} so it reads false outside
   * an actual save — even if the form's loading signal later toggles for a non-submit reason.
   */
  private readonly submitTriggered = signal(false);

  /**
   * Whether the form is busy — a `<tn-side-panel>` host reads this to show its progress bar and to
   * keep Save disabled. In side-panel mode the inner `<ix-form>` renders no loader (its chrome is
   * SlideIn-only), so without this a save shows no progress feedback. Defaults to the loading signal
   * handed to {@link trackCanSubmit} — typically a submit-in-flight flag, though for forms whose
   * loading signal also covers initial data load this will read busy during that load too. Forms
   * that build `canSubmit` without `trackCanSubmit` should `override` this to return their own
   * loading signal. The progress bar during a load is harmless; the "Saving…" label is driven by
   * {@link isSubmitting} (not this) so a load never mislabels Save as saving.
   */
  isBusy(): boolean {
    return this.submitLoading();
  }

  /**
   * Whether a save is actually in flight — distinct from {@link isBusy}, which for some forms also
   * covers an initial data load. The `<tn-side-panel>` host reads this (not `isBusy`) to switch Save
   * to "Saving…", so a form merely loading its initial config doesn't show a misleading "Saving…".
   * True only while busy work that {@link submit} kicked off is still running, because
   * {@link submitTriggered} is cleared on that work's falling edge (see constructor); so an initial
   * load (before any submit) reads false, and so does a later non-submit busy toggle.
   */
  readonly isSubmitting = computed(() => this.submitTriggered() && this.isBusy());

  /** Performs the actual save. Invoked by the host-facing {@link submit}. */
  protected abstract onSubmit(): void;

  constructor() {
    this.slideInRef?.requireConfirmationWhen(() => of(this.hasUnsavedChanges()));

    // Clear the submit latch on the falling edge of busy: once the save's busy period ends, a later
    // non-submit busy toggle won't mislabel Save as "Saving…". Only the falling edge clears it, so
    // setting the latch in submit() before busy rises is safe. This assumes every onSubmit() raises
    // a busy edge (true async save); a submit that bails out synchronously without ever going busy
    // leaves the latch set — harmless on its own since isSubmitting ANDs in isBusy(), but a later
    // non-submit busy period would then read as submitting until the next real save settles it.
    let wasBusy = false;
    effect(() => {
      const busy = this.isBusy();
      if (wasBusy && !busy) {
        this.submitTriggered.set(false);
      }
      wasBusy = busy;
    });
  }

  /** Public entry point for hosts (e.g. `<tn-side-panel>`) to trigger form submission. */
  submit(): void {
    this.submitTriggered.set(true);
    this.onSubmit();
  }

  /** Host hook (e.g. `<tn-side-panel>` closeGuard) to confirm before discarding unsaved edits. */
  hasUnsavedChanges(): boolean {
    return this.form.dirty;
  }

  /**
   * Closes through whichever host opened the form, emitting the boolean saved-signal. For the
   * default `R = boolean` this is exact; forms with a richer payload close by emitting `R`
   * through {@link closed} directly instead of calling this.
   */
  protected close(saved: boolean): void {
    if (this.slideInRef) {
      this.slideInRef.close({ response: saved });
    } else {
      this.closed.emit(saved as unknown as R);
    }
  }

  /**
   * Builds the `canSubmit` signal from the form's validity and the given loading signal.
   * Call from a field initializer after {@link form} is assigned, e.g.
   * `protected readonly canSubmit = this.trackCanSubmit(this.isFormLoading);`
   */
  protected trackCanSubmit(isLoading: Signal<boolean>): Signal<boolean> {
    // Surface the same loading signal as isBusy so the side-panel host can show its loader.
    this.submitLoading = isLoading;
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
