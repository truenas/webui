import { ComponentHarness } from '@angular/cdk/testing';

export class ConfigurationPreviewHarness extends ComponentHarness {
  static readonly hostSelector = 'ix-configuration-preview';

  async getItems(): Promise<Record<string, string>> {
    const itemTexts: Record<string, string> = {};
    const items = await this.locatorForAll('.details-item')();
    for (const item of items) {
      const label = await item.text({ exclude: '.value' });
      const value = await item.text({ exclude: '.label' });
      itemTexts[label] = value;
    }
    return itemTexts;
  }
}
