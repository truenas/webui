import { mockProvider } from '@ngneat/spectator/jest'; // cspell:ignore ngneat
import {
  defaultMinSubmitFeedbackMs, ixFormMinSubmitFeedbackMs,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';

export interface IxFormTestingOptions {
  /**
   * Keep the real {@link ixFormMinSubmitFeedbackMs} instead of the `0` this helper provides by
   * default, so a successful close stays held behind the `timer()`.
   *
   * Off by default: a spec that asserts on `closed` right after `submit()` races the hold. Set it
   * only when the hold itself is under test.
   */
  realSubmitFeedback?: boolean;
}

/**
 * Providers required when a component under test renders `<ix-form>`. Supplies
 * mocks for the services IxFormComponent injects internally (error handling,
 * snackbar) plus `SlideIn` — the embedded `<ix-modal-header>` reads
 * `SlideIn.openSlideIns()` (the signal that counts currently-open slide-ins)
 * to compute its overlay-position tooltip; without this mock, tests would
 * crash trying to call `.openSlideIns()` on an undefined service.
 *
 * Also zeroes {@link ixFormMinSubmitFeedbackMs}. In a `<tn-side-panel>` host a successful submit
 * is held behind a minimum-duration timer so the panel's loader is actually perceptible, which
 * makes the close asynchronous; `0` restores the un-delayed path so a spec can assert the `closed`
 * emission synchronously after submitting. Pass `{ realSubmitFeedback: true }` to keep the real
 * duration — the real timer path has a single owner today: the "minimum submit feedback
 * (side-panel host)" block in `ix-form.component.spec.ts`.
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
    // Always provided, never merely omitted: every factory in a spec file registers its providers
    // and the last one wins, so an omission here would let an outer factory's `0` leak into a
    // nested factory that asked to keep the hold.
    {
      provide: ixFormMinSubmitFeedbackMs,
      useValue: options.realSubmitFeedback ? defaultMinSubmitFeedbackMs : 0,
    },
  ];
}
