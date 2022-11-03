import {
  BaseHarnessFilters, ComponentHarness, HarnessPredicate,
} from '@angular/cdk/testing';

export interface IxLabelFilters extends BaseHarnessFilters {
  label: string;
}

export class IxLabelHarness extends ComponentHarness {
  static hostSelector = 'ix-label';

  static with(options: IxLabelFilters): HarnessPredicate<IxLabelHarness> {
    return new HarnessPredicate(IxLabelHarness, options)
      .addOption('label', options.label,
        (harness, label) => HarnessPredicate.stringMatches(harness.getLabel(), label));
  }

  async getLabel(): Promise<string> {
    const label = await this.locatorForOptional('label')();
    if (!label) {
      return '';
    }

    return label.text({ exclude: '.required' });
  }
}
