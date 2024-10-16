import { BaseHarnessFilters, ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';
import { MatSlideToggleHarness } from '@angular/material/slide-toggle/testing';
import { IxFormControlHarness } from 'app/modules/forms/ix-forms/interfaces/ix-form-control-harness.interface';
import { getErrorText } from 'app/modules/forms/ix-forms/utils/harness.utils';

export interface IxSlideToggleHarnessFilters extends BaseHarnessFilters {
  label: string;
}

export class IxSlideToggleHarness extends ComponentHarness implements IxFormControlHarness {
  static readonly hostSelector = 'ix-slide-toggle';

  static with(options: IxSlideToggleHarnessFilters): HarnessPredicate<IxSlideToggleHarness> {
    return new HarnessPredicate(IxSlideToggleHarness, options)
      .addOption('label', options.label, (harness, label) => HarnessPredicate.stringMatches(harness.getLabelText(), label));
  }

  getMatSlideToggleHarness = this.locatorFor(MatSlideToggleHarness);
  getErrorText = getErrorText;

  async getLabelText(): Promise<string> {
    const label = await this.locatorFor('label')();
    return label.text({ exclude: '.required' });
  }

  async getValue(): Promise<boolean> {
    return (await this.getMatSlideToggleHarness()).isChecked();
  }

  async setValue(value: boolean): Promise<void> {
    const matSlideToggleHarness = await this.getMatSlideToggleHarness();
    if (value) {
      return matSlideToggleHarness.check();
    }

    return matSlideToggleHarness.uncheck();
  }

  async isDisabled(): Promise<boolean> {
    return (await this.getMatSlideToggleHarness()).isDisabled();
  }

  async toggle(): Promise<void> {
    return (await this.getMatSlideToggleHarness()).toggle();
  }
}
