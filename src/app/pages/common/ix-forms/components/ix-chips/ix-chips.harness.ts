import { BaseHarnessFilters, ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';
import { MatChipHarness, MatChipListHarness } from '@angular/material/chips/testing';
import { MatChipInputHarness } from '@angular/material/chips/testing/chip-input-harness';
import { IxFormControlHarness } from 'app/pages/common/ix-forms/interfaces/ix-form-control-harness.interface';

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

  async getChipInputHarness(): Promise<MatChipInputHarness> {
    return (await this.getMatChipListHarness()).getInput();
  }

  async getLabelText(): Promise<string> {
    const label = await this.locatorFor('label')();
    return label.text({ exclude: '.required' });
  }

  async getErrorText(): Promise<string> {
    const label = await this.locatorForOptional('ix-form-errors')();
    return label?.text() || '';
  }

  async getValue(): Promise<string[]> {
    const chips = await this.getMatChips();

    if (!chips.length) {
      return [];
    }

    const values: string[] = [];
    for (const chip of chips) {
      values.push(await chip.getText());
    }

    return values;
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

    for (const chip of chips) {
      await chip.remove();
    }
  }

  async addChips(values: string[]): Promise<void> {
    const input = await this.getChipInputHarness();
    for (const value of values) {
      await input.setValue(value);
      await input.blur();
    }
  }
}
