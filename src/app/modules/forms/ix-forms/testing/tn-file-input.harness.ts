import { HarnessPredicate } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FileInputHarnessFilters, TnFileInputHarness } from '@truenas/ui-components';

/**
 * `TnFileInputHarness` with the writer the library's own harness doesn't ship.
 *
 * The library harness exposes only readers (`getButtonText`/`getFileName`/`hasFile`/`isDisabled`/
 * `open`), so a spec that needs the control to *hold* a value has to drive the native input the way
 * `IxFileInputHarness.setValue` did: dispatch a synthetic `change` whose `target.files` the
 * component's `onFilesSelected` reads. Subclassing keeps that inside a harness — `locatorFor` is
 * only reachable from within one — instead of scattering raw DOM queries through specs.
 *
 * Drop this once `TnFileInputHarness` grows a `setValue` (NAS-141021).
 */
export class TnFileInputTestHarness extends TnFileInputHarness {
  private nativeFileInput = this.locatorFor('input[type="file"]');

  static override with(options: FileInputHarnessFilters = {}): HarnessPredicate<TnFileInputTestHarness> {
    return new HarnessPredicate(TnFileInputTestHarness, options)
      .addOption('testId', options.testId, async (harness, testId) => (await harness.getTestId()) === testId);
  }

  async setValue(files: File[]): Promise<void> {
    const nativeInput = TestbedHarnessEnvironment.getNativeElement(await this.nativeFileInput()) as HTMLInputElement;

    const event = new Event('change');
    Object.defineProperty(event, 'target', { value: { files }, writable: true });

    nativeInput.dispatchEvent(event);
  }
}
