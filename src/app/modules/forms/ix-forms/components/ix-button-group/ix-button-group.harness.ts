import {
  BaseHarnessFilters, ComponentHarness, HarnessPredicate,
} from '@angular/cdk/testing';
import { MatButtonToggleGroupHarness } from '@angular/material/button-toggle/testing';
import { IxLabelHarness } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.harness';
import { IxFormControlHarness } from 'app/modules/forms/ix-forms/interfaces/ix-form-control-harness.interface';
import { getErrorText } from 'app/modules/forms/ix-forms/utils/harness.utils';

export interface IxButtonGroupHarnessFilters extends BaseHarnessFilters {
  label?: string;
}

export class IxButtonGroupHarness extends ComponentHarness implements IxFormControlHarness {
  static readonly hostSelector = 'ix-button-group';

  static with(options: IxButtonGroupHarnessFilters): HarnessPredicate<IxButtonGroupHarness> {
    return new HarnessPredicate(IxButtonGroupHarness, options)
      .addOption(
        'label',
        options.label,
        (harness, label) => HarnessPredicate.stringMatches(harness.getLabelText(), label),
      );
  }

  getButtonToggleGroupHarness = this.locatorFor(MatButtonToggleGroupHarness);
  getErrorText = getErrorText;

  async getLabelText(): Promise<string> {
    const label = await this.locatorForOptional(IxLabelHarness)();
    if (!label) {
      return '';
    }
    return label.getLabel();
  }

  async getValue(): Promise<string> {
    const buttons = await (await this.getButtonToggleGroupHarness()).getToggles({ checked: true });
    return buttons[0]?.getText();
  }

  async setValue(value: string): Promise<void> {
    const buttons = await (await this.getButtonToggleGroupHarness()).getToggles({ text: value });
    if (!buttons.length) {
      throw new Error(`No button with text "${value}" found`);
    }

    return buttons[0].check();
  }

  async isDisabled(): Promise<boolean> {
    return (await this.getButtonToggleGroupHarness()).isDisabled();
  }

  async getOptions(): Promise<string[]> {
    const buttons = await (await this.getButtonToggleGroupHarness()).getToggles();
    return Promise.all(buttons.map((button) => button.getText()));
  }
}
