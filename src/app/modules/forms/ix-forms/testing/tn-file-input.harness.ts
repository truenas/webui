import { HarnessPredicate } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FileInputHarnessFilters, TnFileInputHarness } from '@truenas/ui-components';

/**
 * `TnFileInputHarness` plus the `setValue` the library harness lacks: it dispatches a synthetic
 * `change` whose `target.files` the component reads, kept inside a harness since only one can use
 * `locatorFor`. Drop it once the library harness gains `setValue` (NAS-141021).
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
