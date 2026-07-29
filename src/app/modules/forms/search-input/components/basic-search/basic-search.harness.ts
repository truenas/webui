import { ComponentHarness } from '@angular/cdk/testing';
import { TnInputHarness } from '@truenas/ui-components';

export class BasicSearchHarness extends ComponentHarness {
  static readonly hostSelector = 'ix-basic-search';

  getInput = this.locatorFor(TnInputHarness);
  getSwitchLink = this.locatorForOptional('.switch-link');

  async getValue(): Promise<string> {
    return (await this.getInput()).getValue();
  }

  async setValue(value: string): Promise<void> {
    return (await this.getInput()).setValue(value);
  }

  async clearInput(): Promise<void> {
    return (await this.getInput()).clickSuffixAction();
  }

  async clickSwitchToAdvanced(): Promise<void> {
    return (await this.getSwitchLink())?.click();
  }
}
