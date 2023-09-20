import { ComponentHarness } from '@angular/cdk/testing';

export class NewDevicesConfigurationPreviewHarness extends ComponentHarness {
  static hostSelector = 'ix-new-devices-preview';

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
