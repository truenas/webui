import {
  BaseHarnessFilters, ComponentHarness, HarnessPredicate, parallel, TestKey,
} from '@angular/cdk/testing';
import { MatChipHarness, MatChipInputHarness, MatChipListHarness } from '@angular/material/chips/testing';
import { IxLabelHarness } from 'app/modules/ix-forms/components/ix-label/ix-label.harness';
import { IxFormControlHarness } from 'app/modules/ix-forms/interfaces/ix-form-control-harness.interface';
import { getErrorText } from 'app/modules/ix-forms/utils/harness.utils';

export interface IxChipsHarnessFilters extends BaseHarnessFilters {
  label: string;
}

export class IxChipsHarness extends ComponentHarness implements IxFormControlHarness {
  static hostSelector = 'ix-chips';

  static with(options: IxChipsHarnessFilters): HarnessPredicate<IxChipsHarness> {
    return new HarnessPredicate(IxChipsHarness, options)
      .addOption('label', options.label,
        (harness, label) => HarnessPredicate.stringMatches(harness.getLabelText(), label));
  }

  getMatChipListHarness = this.locatorFor(MatChipListHarness);
  getMatChips = this.locatorForAll(MatChipHarness);
  getErrorText = getErrorText;

  async getChipInputHarness(): Promise<MatChipInputHarness> {
    return (await this.getMatChipListHarness()).getInput();
  }

  async getLabelText(): Promise<string> {
    const label = await this.locatorForOptional(IxLabelHarness)();
    if (!label) {
      return '';
    }
    return label.getLabel();
  }

  async getValue(): Promise<string[]> {
    const chips = await this.getMatChips();

    if (!chips.length) {
      return [];
    }

    return parallel(() => chips.map((chip) => chip.getText()));
  }

  async setValue(values: string[]): Promise<void> {
    await this.removeAllChips();

    if (values.length) {
      await this.addChips(values);
    }
  }

  async removeAllChips(): Promise<void> {
    const chips = await this.getMatChips();
    if (!chips.length) {
      return;
    }

    await parallel(() => chips.map((chip) => chip.remove()));
  }

  async addChips(values: string[]): Promise<void> {
    const input = await this.getChipInputHarness();
    for (const value of values) {
      await input.setValue(value);
      await input.sendSeparatorKey(TestKey.ENTER);
    }
  }

  async isDisabled(): Promise<boolean> {
    return (await this.getChipInputHarness()).isDisabled();
  }
}
