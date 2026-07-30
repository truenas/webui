import { FormGroup } from '@angular/forms';
import { mockProvider } from '@ngneat/spectator/jest'; // cspell:ignore ngneat
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { SidePanelHostForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';

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
export function ixFormTestingProviders(): unknown[] {
  return [
    mockProvider(FormErrorHandlerService),
    mockProvider(SnackbarService),
    mockProvider(SlideIn, {
      openSlideIns: jest.fn(() => 1),
    }),
  ];
}

/**
 * The `form` a side-panel-hosted form renders inside its `<ix-form>`.
 *
 * `form` is `protected`, so this casts to reach it — an escape hatch, not the default. Drive the
 * rendered controls through their `tn-*` harnesses wherever a harness can express the same thing.
 * The case it exists for is seeding a form whose config load was made to fail, so that the
 * assertion is about `loadFailed` and not about unfilled required fields.
 */
export function hostedFormGroup<R>(host: SidePanelHostForm<R>): FormGroup {
  return (host as unknown as { form: FormGroup }).form;
}
