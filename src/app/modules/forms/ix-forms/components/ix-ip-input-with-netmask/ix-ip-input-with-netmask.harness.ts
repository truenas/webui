import {
  BaseHarnessFilters, ComponentHarness, HarnessPredicate,
} from '@angular/cdk/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { MatSelectHarness } from '@angular/material/select/testing';
import { IxLabelHarness } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.harness';
import { IxFormControlHarness } from 'app/modules/forms/ix-forms/interfaces/ix-form-control-harness.interface';
import { getErrorText } from 'app/modules/forms/ix-forms/utils/harness.utils';

export interface IxIpInputWithNetmaskHarnessFilters extends BaseHarnessFilters {
  label?: string;
}

export class IxIpInputWithNetmaskHarness extends ComponentHarness implements IxFormControlHarness {
  static readonly hostSelector = 'ix-ip-input-with-netmask';

  static with(options: IxIpInputWithNetmaskHarnessFilters): HarnessPredicate<IxIpInputWithNetmaskHarness> {
    return new HarnessPredicate(IxIpInputWithNetmaskHarness, options)
      .addOption('label', options.label, (harness, label) => HarnessPredicate.stringMatches(harness.getLabelText(), label));
  }

  getAddressHarness = this.locatorFor(MatInputHarness);
  getNetmaskHarness = this.locatorFor(MatSelectHarness);
  getErrorText = getErrorText;

  async getLabelText(): Promise<string> {
    const label = await this.locatorForOptional(IxLabelHarness)();
    if (!label) {
      return '';
    }
    return label.getLabel();
  }

  async getValue(): Promise<string> {
    const addressInput = await this.getAddressHarness();
    const netmaskSelect = await this.getNetmaskHarness();

    const address = await addressInput.getValue();
    const netmask = await netmaskSelect.getValueText();

    return `${address}/${netmask}`;
  }

  async setValue(addressAndNetmask: string): Promise<void> {
    const [address, netmask] = addressAndNetmask.split('/');
    const addressInput = await this.getAddressHarness();
    const netmaskSelect = await this.getNetmaskHarness();

    await addressInput.setValue(address);
    await netmaskSelect.open();
    await netmaskSelect.clickOptions({ text: netmask });
  }

  async isDisabled(): Promise<boolean> {
    return (await this.getNetmaskHarness()).isDisabled();
  }
}
