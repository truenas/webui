import { ComponentHarness } from '@angular/cdk/testing';
import { TnInputHarness } from '@truenas/ui-components';

export class BasicSearchHarness extends ComponentHarness {
  static readonly hostSelector = 'ix-basic-search';

  getInput = this.locatorFor(TnInputHarness);
  getSwitchLink = this.locatorForOptional('.switch-link');
  /**
   * The tn-input suffix action, located by the role and accessible name a user reaches
   * for rather than by the markup the library happens to render it as.
   */
  getClearAction = this.locatorForOptional('button[aria-label="Clear search"]');

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
