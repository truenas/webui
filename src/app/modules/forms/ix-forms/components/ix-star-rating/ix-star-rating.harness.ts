import {
  BaseHarnessFilters, ComponentHarness, HarnessPredicate, parallel,
} from '@angular/cdk/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { IxLabelHarness } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.harness';
import { IxFormControlHarness } from 'app/modules/forms/ix-forms/interfaces/ix-form-control-harness.interface';
import { getErrorText } from 'app/modules/forms/ix-forms/utils/harness.utils';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';

export interface IxStarRatingFilters extends BaseHarnessFilters {
  label?: string;
}

export class IxStarRatingHarness extends ComponentHarness implements IxFormControlHarness {
  static readonly hostSelector = 'ix-star-rating';

  static with(options: IxStarRatingFilters): HarnessPredicate<IxStarRatingHarness> {
    return new HarnessPredicate(IxStarRatingHarness, options)
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

  async getValue(): Promise<number> {
    const selectedIcons = await this.locatorForAll(IxIconHarness.with({ name: 'mdi-star' }))();
    return selectedIcons.length;
  }

  async setValue(value: number): Promise<void> {
    const buttons = await this.getButtons();
    return buttons[value - 1].click();
  }

  async isDisabled(): Promise<boolean> {
    const buttons = await this.getButtons();
    const inputState = await parallel(() => buttons.map((control) => control.isDisabled()));

    return inputState.every(Boolean);
  }
}
