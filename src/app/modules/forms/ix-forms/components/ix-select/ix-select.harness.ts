import { ComponentHarness, HarnessPredicate, parallel } from '@angular/cdk/testing';
import { SelectHarnessFilters } from '@angular/material/select/testing';
import { IxLabelHarness } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.harness';
import { SelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/select.harness';
import { IxFormControlHarness } from 'app/modules/forms/ix-forms/interfaces/ix-form-control-harness.interface';
import { getErrorText } from 'app/modules/forms/ix-forms/utils/harness.utils';

export interface IxSelectHarnessFilters extends SelectHarnessFilters {
  label?: string;
}

export class IxSelectHarness extends ComponentHarness implements IxFormControlHarness {
  static readonly hostSelector = 'ix-select';

  static with(options: IxSelectHarnessFilters): HarnessPredicate<IxSelectHarness> {
    return new HarnessPredicate(IxSelectHarness, options)
      .addOption('label', options.label, (harness, label) => HarnessPredicate.stringMatches(harness.getLabelText(), label));
  }

  getSelectHarness = this.locatorFor(SelectHarness);
  getErrorText = getErrorText;

  async getLabelText(): Promise<string> {
    const label = await this.locatorForOptional(IxLabelHarness)();
    if (!label) {
      return '';
    }
    return label.getLabel();
  }

  async getValue(): Promise<string | string[]> {
    const select = await this.getSelectHarness();
    await select.open();

    if (await select.isMultiple()) {
      const options = await select.getOptions({ isSelected: true });
      const optionTexts = options.map((option) => option.getText());

      return Promise.all(optionTexts);
    }

    return select.getValueText();
  }

  /**
   * @param newLabels option label or labels to be selected
   */
  async setValue(newLabels: string | string[]): Promise<void> {
    const select = await this.getSelectHarness();
    await select.open();

    if (!await this.hasOptions(newLabels)) {
      throw new Error(`Option with label "${String(newLabels)}" not found in select ${await this.getLabelText()}`);
    }

    if (await select.isMultiple()) {
      // Unselect old options manually
      if (!(await select.isEmpty())) {
        const selectedOptions = await select.getOptions({ isSelected: true });
        await parallel(() => selectedOptions.map((option) => option.click()));
      }

      const labelsToClick = Array.isArray(newLabels) ? newLabels : [newLabels];
      await parallel(() => {
        return labelsToClick.map((label) => select.clickOptions({ text: label }));
      });
      return;
    }

    await select.clickOptions({ text: newLabels as string });
  }

  async isDisabled(): Promise<boolean> {
    return (await this.getSelectHarness()).isDisabled();
  }

  async getOptionLabels(): Promise<string[]> {
    const matSelect = await this.getSelectHarness();
    await matSelect.open();
    const options = await matSelect.getOptions();

    return parallel(() => options.map((option) => option.getText()));
  }

  async hasOptions(labels: string | string[]): Promise<boolean> {
    const optionLabels = await this.getOptionLabels();
    const labelsToCheck = Array.isArray(labels) ? labels : [labels];
    return labelsToCheck.every((label) => optionLabels.includes(label));
  }

  async selectAll(): Promise<void> {
    const labels = await this.getOptionLabels();
    return this.setValue(labels);
  }

  async unselectAll(): Promise<void> {
    return this.setValue([]);
  }
}
