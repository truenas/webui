import { BaseHarnessFilters, ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';

export interface IxInputGroupHarnessFilters extends BaseHarnessFilters {
  label: string;
}

export class IxInputGroupHarness extends ComponentHarness {
  static hostSelector = 'ix-input-group';

  static with(options: IxInputGroupHarnessFilters): HarnessPredicate<IxInputGroupHarness> {
    return new HarnessPredicate(IxInputGroupHarness, options)
      .addOption('label', options.label,
        (harness, label) => HarnessPredicate.stringMatches(harness.getLabelText(), label));
  }

  async getLabelText(): Promise<string> {
    const label = await this.locatorFor('label')();
    return label.text({ exclude: '.required' });
  }
}
