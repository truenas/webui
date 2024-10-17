import {
  BaseHarnessFilters, ComponentHarness, HarnessPredicate, parallel,
} from '@angular/cdk/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatIconHarness } from '@angular/material/icon/testing';
import { IxLabelHarness } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.harness';
import { IxFormControlHarness } from 'app/modules/forms/ix-forms/interfaces/ix-form-control-harness.interface';
import { getErrorText } from 'app/modules/forms/ix-forms/utils/harness.utils';

export interface IxIconGroupFilters extends BaseHarnessFilters {
  label?: string;
}

export class IxIconGroupHarness extends ComponentHarness implements IxFormControlHarness {
  static readonly hostSelector = 'ix-icon-group';

  static with(options: IxIconGroupFilters): HarnessPredicate<IxIconGroupHarness> {
    return new HarnessPredicate(IxIconGroupHarness, options)
      .addOption('label', options.label, (harness, label) => HarnessPredicate.stringMatches(harness.getLabelText(), label));
  }

  getButtons = this.locatorForAll(MatButtonHarness);
  getIcons = this.locatorForAll(MatIconHarness.with({ ancestor: '.icon-group' }));
  getErrorText = getErrorText;

  async getLabelText(): Promise<string> {
    const label = await this.locatorForOptional(IxLabelHarness)();
    if (!label) {
      return '';
    }
    return label.getLabel();
  }

  async getValue(): Promise<string | undefined> {
    const selectedButton = await this.locatorForOptional(MatButtonHarness.with({ selector: '.selected' }))();
    if (!selectedButton) {
      return '';
    }

    return (await selectedButton.host()).getAttribute('data-value');
  }

  async setValue(value: string): Promise<void> {
    const button = this.locatorFor(MatButtonHarness.with({ selector: `[data-value="${value}"]` }))();
    (await button)?.click();
  }

  async isDisabled(): Promise<boolean> {
    const buttons = await this.getButtons();
    const inputState = await parallel(() => buttons.map((control) => control.isDisabled()));

    return inputState.every(Boolean);
  }
}
