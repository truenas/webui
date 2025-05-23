import {
  BaseHarnessFilters,
  ContentContainerComponentHarness,
  HarnessPredicate,
} from '@angular/cdk/testing';

export interface DetailsItemHarnessFilters extends BaseHarnessFilters {
  label?: string;
}

export class DetailsItemHarness extends ContentContainerComponentHarness {
  static readonly hostSelector = 'ix-details-item';

  static with(options: DetailsItemHarnessFilters): HarnessPredicate<DetailsItemHarness> {
    return new HarnessPredicate(DetailsItemHarness, options)
      .addOption('label', options.label, (harness, label) => HarnessPredicate.stringMatches(harness.getLabelText(), label));
  }

  keyColumn = this.locatorFor('.key-column');
  valueColumn = this.locatorFor('.value-column');

  async getLabelText(): Promise<string> {
    const label = await this.keyColumn();
    return label.text({ exclude: 'ix-tooltip' });
  }

  async getValueText(): Promise<string> {
    const value = await this.valueColumn();
    return value.text();
  }
}
