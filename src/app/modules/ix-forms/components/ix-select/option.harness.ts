import { HarnessPredicate } from '@angular/cdk/testing';
import {
  OptionHarnessFilters,
  MatOptionHarness,
} from '@angular/material/core/testing';

/**
 * Native MatOptionHarness adds tooltip text in option text.
 * This overrides this behavior.
 */
export class OptionHarness extends MatOptionHarness {
  private text = this.locatorFor('.mat-mdc-option-text');

  // TODO: This shouldn't be necessary once we migrate away from the legacy harnesses.
  static with(options: OptionHarnessFilters = {}): HarnessPredicate<OptionHarness> {
    return new HarnessPredicate(OptionHarness, options)
      .addOption('text', options.text, async (harness, title) => {
        return HarnessPredicate.stringMatches(await harness.getText(), title);
      })
      .addOption(
        'isSelected',
        options.isSelected,
        async (harness, isSelected) => (await harness.isSelected()) === isSelected,
      );
  }

  async getText(): Promise<string> {
    return (await this.text()).text({ exclude: 'ix-tooltip' });
  }
}
