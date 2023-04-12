import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { ComponentHarness } from '@angular/cdk/testing';
import _ from 'lodash';
import { IxFormControlHarness } from 'app/modules/ix-forms/interfaces/ix-form-control-harness.interface';
import { getErrorText } from 'app/modules/ix-forms/utils/harness.utils';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';

export class IxFilterSelectListHarness extends ComponentHarness implements IxFormControlHarness {
  static hostSelector = 'ix-filter-select-list';

  getItems = this.locatorForAll('.item');
  getIcons = this.locatorForAll(IxIconHarness);
  getErrorText = getErrorText;

  async getLabelText(): Promise<string> {
    const label = await this.locatorForOptional('.label')();
    if (!label) {
      return '';
    }
    return label.text();
  }

  async getValue(): Promise<string[]> {
    const items = await this.getItems();
    const icons = await this.getIcons();
    const checkedValues: string[] = [];

    for (const [idx, item] of items.entries()) {
      if ((await icons[idx].getName()) === 'check_circle') {
        checkedValues.push(await item.text());
      }
    }

    return checkedValues;
  }

  async setValue(value: string[] | string): Promise<void> {
    if (_.isString(value)) {
      value = [value];
    }
    const items = await this.getItems();
    const icons = await this.getIcons();

    for (const [idx, item] of items.entries()) {
      if (
        ((await icons[idx].getName()) !== 'check_circle' && value.includes(await item.text()))
        || ((await icons[idx].getName()) === 'check_circle' && !value.includes(await item.text()))
      ) {
        await item.click();
      }
    }
  }

  async isDisabled(): Promise<boolean> {
    return coerceBooleanProperty(await (await this.host()).getProperty('aria-disabled'));
  }
}
