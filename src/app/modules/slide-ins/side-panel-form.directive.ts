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
 *
 * Note: forms built on the clean `<ix-form>` renderer (`IxFormRendererComponent`) already expose
 * `isBusy`/`isSubmitting` by delegating to its separate loading/submitting signals. The
 * {@link submitTriggered} latch below exists only for hand-rolled forms whose single loading signal
 * conflates initial data load and submit, so a load can't be told apart from a save without it.
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
   * Set by {@link submit} to mark that a save was requested, and consumed on the next rising edge
   * of {@link isBusy} (see the constructor effect) — at which point we know the save really kicked
   * off async work and {@link submitTriggered} latches. Cleared synchronously by {@link submit} if
   * `onSubmit()` returns without going busy, so a submit that bails out (a guard/validation early
   * return) never leaves a pending request that a later non-submit busy period could latch onto.
   */
  private readonly submitRequested = signal(false);

  /**
   * Latched on the rising edge of the busy period a {@link submit} kicked off, and cleared once that
   * busy period settles (see the edge handling in the constructor); gates {@link isSubmitting} so it
   * reads false outside an actual save — even if the form's loading signal later toggles for a
   * non-submit reason. Because it only latches once busy actually rises (never pre-set in
   * {@link submit}), a submit that bails out synchronously leaves it false.
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
   * {@link submitTriggered} only latches on that work's rising edge and clears on its falling edge
   * (see constructor); so an initial load (before any submit) reads false, and so does a later
   * non-submit busy toggle.
   */
  readonly isSubmitting = computed(() => this.submitTriggered() && this.isBusy());

  /** Performs the actual save. Invoked by the host-facing {@link submit}. */
  protected abstract onSubmit(): void;

  constructor() {
    this.slideInRef?.requireConfirmationWhen(() => of(this.hasUnsavedChanges()));

    // Drive the submit latch off the edges of busy rather than pre-setting it in submit():
    //  - rising edge while a submit is pending: the save really kicked off async work, so latch it;
    //  - falling edge: that busy period ended, so clear the latch.
    // Latching only on the rising edge means a submit that bails out synchronously (a guard or
    // validation early-return that never goes busy) leaves the latch false — so a later non-submit
    // busy period (e.g. an edit-mode reload) is never mislabeled as "Saving…".
    let wasBusy = false;
    effect(() => {
      const busy = this.isBusy();
      if (busy && !wasBusy && this.submitRequested()) {
        this.submitRequested.set(false);
        this.submitTriggered.set(true);
      } else if (wasBusy && !busy) {
        this.submitTriggered.set(false);
      }
      wasBusy = busy;
    });
  }

  /** Public entry point for hosts (e.g. `<tn-side-panel>`) to trigger form submission. */
  submit(): void {
    this.submitRequested.set(true);
    this.onSubmit();
    // onSubmit() that bails synchronously never raised a busy edge, so there's nothing in flight to
    // latch; drop the pending request (forms set their loading signal synchronously before the API
    // call, so a real save reads busy here and keeps the request for the rising-edge latch above).
    if (!this.isBusy()) {
      this.submitRequested.set(false);
    }
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
