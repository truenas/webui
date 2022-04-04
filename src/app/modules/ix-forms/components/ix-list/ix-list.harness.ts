import { BaseHarnessFilters, ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';
import { MatButtonHarness } from '@angular/material/button/testing';

export interface IxListHarnessFilters extends BaseHarnessFilters {
  label: string;
}

export class IxListHarness extends ComponentHarness {
  static hostSelector = 'ix-list';

  static with(options: IxListHarnessFilters): HarnessPredicate<IxListHarness> {
    return new HarnessPredicate(IxListHarness, options)
      .addOption('label', options.label,
        (harness, label) => HarnessPredicate.stringMatches(harness.getLabelText(), label));
  }

  async getLabelText(): Promise<string> {
    const label = await this.locatorFor('label')();
    return label.text({ exclude: '.required' });
  }

  async pressAddButton(): Promise<void> {
    const button = await this.locatorFor(MatButtonHarness.with({ text: 'Add' }))();
    await button.click();
  }
}
