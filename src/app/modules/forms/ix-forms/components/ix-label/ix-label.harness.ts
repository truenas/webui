import {
  BaseHarnessFilters, ComponentHarness, HarnessPredicate,
} from '@angular/cdk/testing';
import { TooltipHarness } from 'app/modules/tooltip/tooltip.harness';

export interface IxLabelFilters extends BaseHarnessFilters {
  label: string;
}

export class IxLabelHarness extends ComponentHarness {
  static readonly hostSelector = 'ix-label';

  readonly getTooltip = this.locatorFor(TooltipHarness);

  static with(options: IxLabelFilters): HarnessPredicate<IxLabelHarness> {
    return new HarnessPredicate(IxLabelHarness, options)
      .addOption('label', options.label, (harness, label) => HarnessPredicate.stringMatches(harness.getLabel(), label));
  }

  async getLabel(): Promise<string> {
    const label = await this.locatorForOptional('label')();
    if (!label) {
      return '';
    }

    return label.text({ exclude: '.required' });
  }

  async isRequired(): Promise<boolean> {
    const required = await this.locatorForOptional('.required')();
    return Boolean(required);
  }
}
