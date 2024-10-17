import { ComponentHarness } from '@angular/cdk/testing';

export class IxTooltipHarness extends ComponentHarness {
  static readonly hostSelector = 'ix-tooltip';

  async getMessage(): Promise<string> {
    const message = await this.locatorForOptional('.tooltip-message')();
    return message ? message.text() : '';
  }
}
