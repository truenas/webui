import { BaseHarnessFilters, ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';

export interface IxEmptyRowHarnessFilters extends BaseHarnessFilters {
  title?: string;
}
export class IxEmptyRowHarness extends ComponentHarness {
  static readonly hostSelector = 'ix-empty-row';

  static with(options: IxEmptyRowHarnessFilters): HarnessPredicate<IxEmptyRowHarness> {
    return new HarnessPredicate(IxEmptyRowHarness, options)
      .addOption('title', options.title, (harness, title) => HarnessPredicate.stringMatches(harness.getTitleText(), title));
  }

  async getTitleText(): Promise<string> {
    const title = await this.locatorForOptional('.empty-title')();
    if (!title) {
      return '';
    }
    return title.text();
  }

  async getMessageText(): Promise<string> {
    const message = await this.locatorForOptional('.empty-message')();
    if (!message) {
      return '';
    }
    return message.text();
  }
}
