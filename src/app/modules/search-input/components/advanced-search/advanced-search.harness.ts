import { ComponentHarness } from '@angular/cdk/testing';

export class AdvancedSearchHarness extends ComponentHarness {
  static hostSelector = 'ix-advanced-search';

  getResetIcon = this.locatorFor('.reset-icon');
  getInputArea = this.locatorFor('.cm-content');
  getInputPlaceholder = this.locatorFor('.cm-placeholder');
  getSwitchLink = this.locatorFor('.switch-link');

  async getValue(): Promise<string> {
    return (await (this.getInputArea())).text();
  }

  async getPlaceholder(): Promise<string> {
    return (await (this.getInputPlaceholder())).text();
  }

  async setValue(value: string): Promise<void> {
    const inputArea = await this.getInputArea();
    await inputArea.setContenteditableValue(value);
    return inputArea.dispatchEvent('input');
  }

  async clickSwitchToBasic(): Promise<void> {
    return (await this.getSwitchLink()).click();
  }
}
