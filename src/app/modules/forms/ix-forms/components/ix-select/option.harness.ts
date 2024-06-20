import { MatOptionHarness } from '@angular/material/core/testing';

/**
 * Native MatOptionHarness adds tooltip text in option text.
 * This overrides this behavior.
 */
export class OptionHarness extends MatOptionHarness {
  private text = this.locatorFor('.mdc-list-item__primary-text');

  override async getText(): Promise<string> {
    return (await this.text()).text({ exclude: 'ix-tooltip' });
  }
}
