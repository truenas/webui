import { mockProvider } from '@ngneat/spectator/jest'; // cspell:ignore ngneat
import {
  defaultIxFormMinSubmitFeedbackMs, ixFormMinSubmitFeedbackMs,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';

export interface IxFormTestingOptions {
  /**
   * Keep the panel-mode minimum-submit-feedback hold, which delays a successful close behind a
   * `timer()` so a fast save still registers visually.
   *
   * Off by default: virtually every spec that drives a side-panel-hosted `<ix-form>` to
   * completion asserts on `closed` right after `submit()`, and the hold makes that assertion
   * race. Set this only when the hold itself is what's under test.
   *
   * Because of that default, the production `forkJoin`/`timer` path has exactly ONE spec covering
   * it: `ix-form.component.spec.ts` › "minimum submit feedback (side-panel host)". If you are
   * refactoring `onFormSubmit`, that is the test standing between you and silently deleting the
   * hold — do not let it be deleted or switched to the default alongside the others.
   */
  holdSubmitFeedback?: boolean;
}

/**
 * Providers required when a component under test renders `<ix-form>`. Supplies
 * mocks for the services IxFormComponent injects internally (error handling,
 * snackbar) plus `SlideIn` — the embedded `<ix-modal-header>` reads
 * `SlideIn.openSlideIns()` (the signal that counts currently-open slide-ins)
 * to compute its overlay-position tooltip; without this mock, tests would
 * crash trying to call `.openSlideIns()` on an undefined service.
 *
 * Returned as a factory so each test gets its own `jest.fn()` for
 * `openSlideIns` — avoids shared call counts leaking between tests.
 */
export function ixFormTestingProviders(options: IxFormTestingOptions = {}): unknown[] {
  return [
    mockProvider(FormErrorHandlerService),
    mockProvider(SnackbarService),
    mockProvider(SlideIn, {
      openSlideIns: jest.fn(() => 1),
    }),
    // Always provided, never merely omitted: a spec file with more than one Spectator factory
    // registers every factory's providers, and the last one wins. Omitting here would let an
    // outer factory's `0` leak into a nested factory that asked to keep the hold.
    {
      provide: ixFormMinSubmitFeedbackMs,
      useValue: options.holdSubmitFeedback ? defaultIxFormMinSubmitFeedbackMs : 0,
    },
  ];
}
