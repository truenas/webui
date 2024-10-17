import { BaseHarnessFilters, ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { lastValueFrom, of } from 'rxjs';
import { IxLabelHarness } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.harness';
import { IxFormControlHarness } from 'app/modules/forms/ix-forms/interfaces/ix-form-control-harness.interface';
import { getErrorText } from 'app/modules/forms/ix-forms/utils/harness.utils';

export interface IxFileInputHarnessFilters extends BaseHarnessFilters {
  label: string;
}

export class IxFileInputHarness extends ComponentHarness implements IxFormControlHarness {
  static readonly hostSelector = 'ix-file-input';

  static with(options: IxFileInputHarnessFilters): HarnessPredicate<IxFileInputHarness> {
    return new HarnessPredicate(IxFileInputHarness, options)
      .addOption('label', options.label, (harness, label) => HarnessPredicate.stringMatches(harness.getLabelText(), label));
  }

  getInput = this.locatorFor('input');
  getErrorText = getErrorText;

  async getNativeInput(): Promise<HTMLInputElement> {
    const input = await this.getInput();
    return TestbedHarnessEnvironment.getNativeElement(input) as HTMLInputElement;
  }

  async getLabelText(): Promise<string> {
    const label = await this.locatorForOptional(IxLabelHarness)();
    if (!label) {
      return '';
    }
    return label.getLabel();
  }

  async getValue(): Promise<File[]> {
    // Not supported.
    return lastValueFrom(of([]));
  }

  async setValue(files: File[]): Promise<void> {
    const nativeInput = await this.getNativeInput();

    const event = new Event('change');
    Object.defineProperty(event, 'target', {
      value: {
        files,
      },
      writable: true,
    });

    nativeInput.dispatchEvent(event);
  }

  async isDisabled(): Promise<boolean> {
    return (await this.getInput()).getProperty('disabled');
  }
}
