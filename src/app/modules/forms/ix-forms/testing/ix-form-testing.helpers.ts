import { mockProvider } from '@ngneat/spectator/jest'; // cspell:ignore ngneat
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
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

const nestedChangedValuesNotice = '[ix-form] changedValues diffs top-level keys shallowly';

/**
 * `<ix-form>` logs a dev-mode notice for any form holding a nested FormGroup/FormArray, warning
 * that `changedValues` reports the whole subtree as changed. For a form that deliberately builds
 * its payload from `allValues` (or otherwise does not rely on `changedValues`), that notice is
 * expected noise — but `failOnConsole` turns it into a test failure.
 *
 * Call from a `beforeEach` in such a spec to swallow just that message; every other `console.warn`
 * still reaches `failOnConsole`. Restore the returned spy in an `afterEach` — Jest is configured
 * with `clearMocks`, which wipes recorded calls but leaves the implementation in place.
 *
 * Silenced per-spec rather than globally in `setup-jest` so the guard keeps failing tests for
 * every form that has a nested group by accident.
 */
export function silenceIxFormNestedGroupNotice(): jest.SpyInstance {
  const originalWarn = console.warn.bind(console) as (...args: unknown[]) => void;

  return jest.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].startsWith(nestedChangedValuesNotice)) {
      return;
    }
    originalWarn(...args);
  });
}
