import { ComponentHarness } from '@angular/cdk/testing';
import { MatInputHarness } from '@angular/material/input/testing';

export class BasicSearchHarness extends ComponentHarness {
  static readonly hostSelector = 'ix-basic-search';

  getResetIcon = this.locatorFor('.reset-icon');
  getInput = this.locatorFor(MatInputHarness);
  getSwitchLink = this.locatorForOptional('.switch-link');

  async getValue(): Promise<string> {
    return (await this.getInput()).getValue();
  }

  async setValue(value: string): Promise<void> {
    return (await this.getInput()).setValue(value);
  }

  async clickSwitchToAdvanced(): Promise<void> {
    return (await this.getSwitchLink()).click();
  }
}
