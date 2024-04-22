import {
  BaseHarnessFilters, ComponentHarness, HarnessPredicate, parallel,
} from '@angular/cdk/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { IxLabelHarness } from 'app/modules/ix-forms/components/ix-label/ix-label.harness';
import { IxFormControlHarness } from 'app/modules/ix-forms/interfaces/ix-form-control-harness.interface';
import { getErrorText } from 'app/modules/ix-forms/utils/harness.utils';

export interface IxIconGroupFilters extends BaseHarnessFilters {
  label?: string;
}

export class IxIconGroupHarness extends ComponentHarness implements IxFormControlHarness {
  static hostSelector = 'ix-icon-group';

  static with(options: IxIconGroupFilters): HarnessPredicate<IxIconGroupHarness> {
    return new HarnessPredicate(IxIconGroupHarness, options)
      .addOption('label', options.label, (harness, label) => HarnessPredicate.stringMatches(harness.getLabelText(), label));
  }

  getButtons = this.locatorForAll(MatButtonHarness);
  getErrorText = getErrorText;

  async getLabelText(): Promise<string> {
    const label = await this.locatorForOptional(IxLabelHarness)();
    if (!label) {
      return '';
    }
    return label.getLabel();
  }

  async getValue(): Promise<string> {
    const selectedButton = this.locatorFor(MatButtonHarness.with({ selector: '.selected' }))();
    return (await (await selectedButton).host()).getAttribute('aria-label');
  }

  async setValue(value: string): Promise<void> {
    const button = this.locatorFor(MatButtonHarness.with({ selector: `[aria-label="${value}"]` }))();
    (await button)?.click();
  }

  async isDisabled(): Promise<boolean> {
    const buttons = await this.getButtons();
    const inputState = await parallel(() => buttons.map((control) => control.isDisabled()));

    return new Promise((resolve) => {
      resolve(inputState.every(Boolean));
    });
  }
}
