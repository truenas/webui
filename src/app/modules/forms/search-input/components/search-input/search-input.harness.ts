import { ComponentHarness } from '@angular/cdk/testing';
import { AdvancedSearchHarness } from 'app/modules/forms/search-input/components/advanced-search/advanced-search.harness';
import { BasicSearchHarness } from 'app/modules/forms/search-input/components/basic-search/basic-search.harness';

export class SearchInputHarness extends ComponentHarness {
  static readonly hostSelector = 'ix-search-input2';

  async getActiveModeHarness(): Promise<BasicSearchHarness | AdvancedSearchHarness> {
    const harnesses = await this.locatorForAll(BasicSearchHarness, AdvancedSearchHarness)();
    return harnesses[0];
  }

  async isInAdvancedMode(): Promise<boolean> {
    return (await this.getActiveModeHarness()) instanceof AdvancedSearchHarness;
  }

  async getValue(): Promise<string> {
    return (await this.getActiveModeHarness()).getValue();
  }

  async setValue(value: string): Promise<void> {
    return (await this.getActiveModeHarness()).setValue(value);
  }

  async toggleMode(): Promise<void> {
    const modeHarness = await this.getActiveModeHarness();
    return (await modeHarness.getSwitchLink()).click();
  }
}
