import { ComponentHarness } from '@angular/cdk/testing';
import {
  CodemirrorAutocompleteHarness,
} from 'app/modules/forms/search-input/components/advanced-search/codemirror-autocomplete.harness';

export class AdvancedSearchHarness extends ComponentHarness {
  static readonly hostSelector = 'ix-advanced-search';

  getResetIcon = this.locatorFor('.reset-icon');
  getInputArea = this.locatorFor('.cm-content');
  getSwitchLink = this.locatorFor('.switch-link');
  getAutocomplete = this.documentRootLocatorFactory().locatorFor(CodemirrorAutocompleteHarness);

  async getValue(): Promise<string> {
    return (await this.getInputArea()).text();
  }

  async setValue(value: string): Promise<void> {
    const inputArea = await this.getInputArea();
    await inputArea.setContenteditableValue(value);

    await inputArea.dispatchEvent('input');

    // Using fakeAsync doesn't work for some reason.
    await new Promise((resolve) => {
      setTimeout(resolve);
    });

    await this.forceStabilize();
  }

  async clickSwitchToBasic(): Promise<void> {
    return (await this.getSwitchLink()).click();
  }
}
