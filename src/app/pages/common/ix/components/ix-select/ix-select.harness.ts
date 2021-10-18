import { ComponentHarness } from '@angular/cdk/testing';
import { OptionHarnessFilters } from '@angular/material/core/testing';
import { MatSelectHarness } from '@angular/material/select/testing';
import { IxFormControlHarness } from 'app/pages/common/ix/interfaces/ix-form-control-harness.interface';

export interface IxSelectHarnessFilters extends OptionHarnessFilters {
  label: string | RegExp;
}

export class IxSelectHarness extends ComponentHarness implements IxFormControlHarness {
  static hostSelector = 'ix-select';

  getMatSelectHarness = this.locatorFor(MatSelectHarness);

  async getLabelText(): Promise<string> {
    const label = await this.locatorFor('label')();
    return label.text({ exclude: '.required' });
  }

  async getErrorText(): Promise<string> {
    const label = await this.locatorForOptional('ix-form-errors')();
    return label?.text() || '';
  }

  async getValue(): Promise<string | string[]> {
    const select = await this.getMatSelectHarness();
    await select.open();

    if (await select.isMultiple()) {
      const options = await select.getOptions({ isSelected: true });
      const optionTexts = options.map((option) => option.getText());

      return Promise.all(optionTexts);
    }

    return (await this.getMatSelectHarness()).getValueText();
  }

  async setValue(filter: IxSelectHarnessFilters): Promise<void> {
    const select = await this.getMatSelectHarness();
    return select.clickOptions({ text: filter.label });
  }
}
