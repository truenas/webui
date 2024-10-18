import { ComponentHarness } from '@angular/cdk/testing';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';

export class WidgetBackupHarness extends ComponentHarness {
  static readonly hostSelector = 'ix-widget-backup';

  async getHeader(): Promise<{ title: string; icon: string; message: string }> {
    const title = await this.locatorForOptional('.title h3')();
    const icon = await this.locatorForOptional(IxIconHarness.with({ selector: '.icon' }))();
    const message = await this.locatorForOptional('.status-container')();
    return {
      title: await title?.text(),
      icon: await icon?.getName(),
      message: await message?.text(),
    };
  }

  async getBannerMessage(): Promise<string> {
    const message = await this.locatorForOptional('.banner')();
    return message ? (await message.text()).trim() : null;
  }

  async getEmptyCardMessage(): Promise<string | null> {
    const message = await this.locatorForOptional('.empty-card-content .backup-actions')();
    return message ? (await message.text()).trim() : null;
  }

  async getTiles(): Promise<Record<string, { firstColumn: string[]; secondColumn: string[] }> | null> {
    const tiles = await this.locatorForAll('.tile')();

    if (!tiles.length) {
      return null;
    }

    const titles = await this.locatorForAll('.tile .title')();
    const label = await this.locatorForAll('.tile .label')();

    const tileTexts: Record<string, { firstColumn: string[]; secondColumn: string[] }> = {};
    for (let i = 0; i < tiles.length; i++) {
      const labelsOnOneCard = 6;
      const delta = labelsOnOneCard * i;
      tileTexts[await titles[i].text()] = {
        firstColumn: [await label[delta + 0].text(), await label[delta + 1].text(), await label[delta + 2].text()],
        secondColumn: [await label[delta + 3].text(), await label[delta + 4].text(), await label[delta + 5].text()],
      };
    }
    return tileTexts;
  }

  async getBackupActionMessages(): Promise<Record<string, string | null> | null> {
    const tiles = await this.locatorForAll('.tile .caption')();

    if (!tiles.length) {
      return null;
    }

    const actionsTexts: Record<string, string | null> = {};
    for (const tile of tiles) {
      actionsTexts[await tile.text({ exclude: '.backup-actions' })] = await tile.text({ exclude: '.title ' }) || null;
    }
    return actionsTexts;
  }
}
