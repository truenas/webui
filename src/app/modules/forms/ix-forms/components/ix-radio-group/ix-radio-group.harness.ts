import {
  BaseHarnessFilters, ComponentHarness, HarnessPredicate, parallel,
} from '@angular/cdk/testing';
import { MatRadioGroupHarness } from '@angular/material/radio/testing';
import { IxLabelHarness } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.harness';
import { IxFormControlHarness } from 'app/modules/forms/ix-forms/interfaces/ix-form-control-harness.interface';
import { getErrorText } from 'app/modules/forms/ix-forms/utils/harness.utils';

export interface IxRadioGroupHarnessFilters extends BaseHarnessFilters {
  label?: string;
}

export class IxRadioGroupHarness extends ComponentHarness implements IxFormControlHarness {
  static readonly hostSelector = 'ix-radio-group';

  static with(options: IxRadioGroupHarnessFilters): HarnessPredicate<IxRadioGroupHarness> {
    return new HarnessPredicate(IxRadioGroupHarness, options)
      .addOption('label', options.label, (harness, label) => HarnessPredicate.stringMatches(harness.getLabelText(), label));
  }

  getMatRadioGroupHarness = this.locatorFor(MatRadioGroupHarness);
  getErrorText = getErrorText;

  async getLabelText(): Promise<string> {
    const label = await this.locatorForOptional(IxLabelHarness)();
    if (!label) {
      return '';
    }
    return label.getLabel();
  }

  async getValue(): Promise<string | undefined> {
    const checkedRadio = await (await this.getMatRadioGroupHarness()).getCheckedRadioButton();
    return checkedRadio?.getLabelText();
  }

  async setValue(value: string): Promise<void> {
    const harness = await this.getMatRadioGroupHarness();
    return harness.checkRadioButton({ label: value });
  }

  async isDisabled(): Promise<boolean> {
    const radioButtons = await (await this.getMatRadioGroupHarness()).getRadioButtons();
    const inputState = await parallel(() => radioButtons.map((control) => control.isDisabled()));

    return inputState.every((control) => !!control);
  }
}
