import { ComponentHarness, parallel } from '@angular/cdk/testing';

export class CodemirrorAutocompleteHarness extends ComponentHarness {
  static readonly hostSelector = '.cm-tooltip-autocomplete';

  private getOptionElements = this.locatorForAll('li');

  async getOptions(): Promise<string[]> {
    const items = await this.getOptionElements();
    return parallel(() => items.map((item) => item.text()));
  }

  async select(text: string): Promise<void> {
    const items = await this.getOptionElements();
    let selectedItem = null;

    for (const item of items) {
      if (await item.text() === text) {
        selectedItem = item;
        break;
      }
    }

    if (!selectedItem) {
      throw new Error(`Cannot find item with text "${text}"`);
    }

    return selectedItem.click();
  }
}
