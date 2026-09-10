import { ComponentHarness } from '@angular/cdk/testing';
import { TnSelectHarness } from '@truenas/ui-components';
import { IxFormControlHarness } from 'app/modules/forms/ix-forms/interfaces/ix-form-control-harness.interface';
import { getErrorText } from 'app/modules/forms/ix-forms/utils/harness.utils';

export class IxIpInputWithNetmaskHarness extends ComponentHarness implements IxFormControlHarness {
  static readonly hostSelector = 'ix-ip-input-with-netmask';

  getAddressInput = this.locatorFor('input');
  getNetmaskHarness = this.locatorFor(TnSelectHarness);
  getErrorText = getErrorText;

  /**
   * Always '': the control renders no label of its own since it became a bare control, so the
   * enclosing `tn-form-field` is what names it. `TnFormControlHarness` reads the label off that
   * field and only delegates the *value* here, so nothing asks this for a name.
   */
  getLabelText(): Promise<string> {
    return Promise.resolve('');
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
