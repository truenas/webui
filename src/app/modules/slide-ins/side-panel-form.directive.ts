import {
  computed, Directive, effect, output, OutputRef, signal, Signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl } from '@angular/forms';
import { startWith } from 'rxjs';

/**
 * The minimal surface EVERY side-panel-hosted component exposes — close signalling and the
 * unsaved-changes guard — which {@link FormSidePanelService} and its container always drive,
 * regardless of whether the panel renders a Save footer. Footerless hosts (e.g. a `tn-stepper`
 * wizard that owns its own Next/Back/Save buttons) satisfy only this; that's why `open()` accepts
 * it rather than the fuller {@link SidePanelHostForm}, so a footerless wizard passes without a cast.
 *
 * @typeParam R success payload handed back to the opener (defaults to `boolean`).
 */
export interface SidePanelHostCloseable<R = boolean> {
  /** Emitted when the form closes; a truthy payload is a save (or the created record for richer `R`). */
  readonly closed: OutputRef<R>;
  /** Whether the form has edits a host should confirm before discarding. */
  hasUnsavedChanges(): boolean;
}

/**
 * Adds the Save-footer surface (validity gate + submission) to {@link SidePanelHostCloseable}.
 * `canSubmit` is a plain callable so both {@link SidePanelForm} (a `Signal`) and `IxFormHostForm`
 * (a method) fit. Forms declare it via their base, so a missing or misnamed member fails to compile.
 */
export interface SidePanelHostForm<R = boolean> extends SidePanelHostCloseable<R> {
  /** Whether the form may currently be submitted (drives the host-owned Save button). */
  canSubmit(): boolean;
  /** Triggers submission from the host (e.g. the panel footer Save). */
  submit(): void;
}

/**
 * Base class for forms hosted in a `<tn-side-panel>`: owns the unsaved-changes confirmation and close
 * plumbing. Subclasses provide {@link form} and {@link onSubmit} and call {@link trackCanSubmit}.
 * `R` is the success payload, `boolean` by default; a form creating a record the opener needs emits
 * it via {@link closed}. The {@link submitTriggered} latch is for hand-rolled forms whose one loading
 * signal covers both load and submit; `<ix-form>`-based forms expose separate signals already.
 */
@Directive()
export abstract class SidePanelForm<R = boolean> implements SidePanelHostForm<R> {
  /**
   * Emitted when the form should close. The success payload is `R` (defaults to `true` when
   * saved / `false` when cancelled); forms with a richer `R` emit the created record on save.
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
   * Drives the host's progress bar and keeps Save disabled; the inner `<ix-form>` renders no loader in
   * side-panel mode. Defaults to the signal given to {@link trackCanSubmit}, which may also cover the
   * initial load; forms that skip `trackCanSubmit` should override it. "Saving…" follows {@link isSubmitting}.
   */
  isBusy(): boolean {
    return this.submitLoading();
  }

  /**
   * Whether a save is in flight, unlike {@link isBusy}, which can also cover the initial load. The host
   * reads this to show "Saving…". {@link submitTriggered} latches only on busy work that
   * {@link submit} started, so a load before any submit, or a later non-submit busy toggle, reads false.
   */
  readonly isSubmitting = computed(() => this.submitTriggered() && this.isBusy());

  /** Performs the actual save. Invoked by the host-facing {@link submit}. */
  protected abstract onSubmit(): void;

  constructor() {
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
   * Closes the panel, handing back the full `R` payload. Use from forms whose `R` is richer than
   * `boolean` (e.g. a picker's "Add New" that returns the created record).
   *
   * Under `FormSidePanelService` only a TRUTHY payload resolves as a save — anything falsy is a
   * cancel, which is how {@link close}`(false)` reports "closed without saving". See
   * `FormSidePanelService.open`, which documents the rule and owns the coercion.
   */
  protected closeWith(payload: R): void {
    this.closed.emit(payload);
  }

  /**
   * Builds `canSubmit` from validity and `isLoading`; call from a field initializer after {@link form}.
   * Blocks only on `INVALID`, not `PENDING`, so an async validator doesn't flicker Save off. Keep it
   * in step with {@link IxFormComponent.canSubmit} so both hosting bases enable Save alike.
   */
  protected trackCanSubmit(isLoading: Signal<boolean>): Signal<boolean> {
    // Surface the same loading signal as isBusy so the side-panel host can show its loader.
    this.submitLoading = isLoading;
    const status = toSignal(
      this.form.statusChanges.pipe(startWith(this.form.status)),
      { initialValue: this.form.status },
    );
    return computed(() => status() !== 'INVALID' && !isLoading());
  }
}
