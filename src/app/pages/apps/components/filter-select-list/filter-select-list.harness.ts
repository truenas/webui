import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { ComponentHarness } from '@angular/cdk/testing';
import { isString } from 'lodash-es';
import { IxFormControlHarness } from 'app/modules/forms/ix-forms/interfaces/ix-form-control-harness.interface';
import { getErrorText } from 'app/modules/forms/ix-forms/utils/harness.utils';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';

export class FilterSelectListHarness extends ComponentHarness implements IxFormControlHarness {
  static readonly hostSelector = 'ix-filter-select-list';

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
      if (await icons[idx].getName() === 'check_circle') {
        checkedValues.push(await item.text());
      }
    }

    return checkedValues;
  }

  async setValue(newValue: string[] | string): Promise<void> {
    if (isString(newValue)) {
      newValue = [newValue];
    }
    const items = await this.getItems();

    for (const [idx, item] of items.entries()) {
      const isChecked = await this.locatorForOptional(`.item:nth-of-type(${idx + 1}) ix-icon[name="check_circle"]`)();
      const shouldBeChecked = newValue.includes(await item.text());

      if ((shouldBeChecked && !isChecked) || (!shouldBeChecked && isChecked)) {
        await item.click();
      }
    }
  }

  async isDisabled(): Promise<boolean> {
    return coerceBooleanProperty(await (await this.host()).getProperty('aria-disabled'));
  }
}
