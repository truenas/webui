import {
  BaseHarnessFilters, ComponentHarness, HarnessPredicate, parallel, TestKey,
} from '@angular/cdk/testing';
import { MatAutocompleteHarness } from '@angular/material/autocomplete/testing';
import {
  MatChipGridHarness,
  MatChipHarness,
} from '@angular/material/chips/testing';
import { IxLabelHarness } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.harness';
import { IxFormControlHarness } from 'app/modules/forms/ix-forms/interfaces/ix-form-control-harness.interface';
import { getErrorText } from 'app/modules/forms/ix-forms/utils/harness.utils';

export interface IxChipsHarnessFilters extends BaseHarnessFilters {
  label: string;
}

export class IxChipsHarness extends ComponentHarness implements IxFormControlHarness {
  static readonly hostSelector = 'ix-chips';

  static with(options: IxChipsHarnessFilters): HarnessPredicate<IxChipsHarness> {
    return new HarnessPredicate(IxChipsHarness, options)
      .addOption('label', options.label, (harness, label) => HarnessPredicate.stringMatches(harness.getLabelText(), label));
  }

  getMatChipListHarness = this.locatorFor(MatChipGridHarness);
  getAutoCompleteHarness = this.locatorFor(MatAutocompleteHarness);
  getMatChips = this.locatorForAll(MatChipHarness);
  getErrorText = getErrorText;

  async getLabelText(): Promise<string> {
    const label = await this.locatorForOptional(IxLabelHarness)();
    if (!label) {
      return '';
    }
    return label.getLabel();
  }

  async selectSuggestionValue(value: string): Promise<void> {
    await this.setValue([value]);
    const harness = await this.getAutoCompleteHarness();

    await harness.focus();
    await harness.selectOption({ text: value });
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
    const input = await (await this.getMatChipListHarness()).getInput();
    for (const value of values) {
      await input.setValue(value);
      await input.sendSeparatorKey(TestKey.ENTER);
    }
  }

  async isDisabled(): Promise<boolean> {
    return (await this.getMatChipListHarness()).isDisabled();
  }
}
