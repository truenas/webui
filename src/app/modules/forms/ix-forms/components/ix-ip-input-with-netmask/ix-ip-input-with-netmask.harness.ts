import {
  BaseHarnessFilters, ComponentHarness, HarnessPredicate,
} from '@angular/cdk/testing';
import { TnSelectHarness } from '@truenas/ui-components';
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

  getAddressInput = this.locatorFor('input');
  getNetmaskHarness = this.locatorFor(TnSelectHarness);
  getErrorText = getErrorText;

  async getLabelText(): Promise<string> {
    const label = await this.locatorForOptional(IxLabelHarness)();
    if (!label) {
      return '';
    }
    return label.getLabel();
  }

  async getValue(): Promise<string> {
    const addressInput = await this.getAddressInput();
    const netmaskSelect = await this.getNetmaskHarness();

    const address = await addressInput.getProperty<string>('value');
    const netmask = await netmaskSelect.getDisplayText();

    return `${address}/${netmask}`;
  }

  async setValue(addressAndNetmask: string): Promise<void> {
    const [address, netmask] = addressAndNetmask.split('/');
    const addressInput = await this.getAddressInput();

    await addressInput.clear();
    await addressInput.setInputValue(address);
    await addressInput.dispatchEvent('input');

    // A value with no `/…` part (e.g. clearing the field with `''`) leaves the netmask untouched;
    // selecting `undefined` on the tn-select would throw "Could not find option matching undefined".
    if (netmask !== undefined) {
      const netmaskSelect = await this.getNetmaskHarness();
      await netmaskSelect.selectOption(netmask);
    }
  }

  async isDisabled(): Promise<boolean> {
    return (await this.getNetmaskHarness()).isDisabled();
  }
}
