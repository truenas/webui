import { mockProvider } from '@ngneat/spectator/jest'; // cspell:ignore ngneat
import { ixFormMinSubmitFeedbackMs } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';

export interface IxFormTestingOptions {
  /**
   * Opt out of the panel-mode minimum-submit-feedback hold, so a successful submit closes
   * synchronously and the test can assert on `closed` right after calling `submit()`.
   *
   * Needed by every spec that drives a side-panel-hosted `<ix-form>` to completion; without it
   * the close is held behind a `timer()` that the assertion would race.
   */
  synchronousSubmit?: boolean;
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
    ...(options.synchronousSubmit ? [{ provide: ixFormMinSubmitFeedbackMs, useValue: 0 }] : []),
  ];
}
