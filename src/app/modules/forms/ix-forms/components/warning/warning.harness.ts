import { ComponentHarness } from '@angular/cdk/testing';

export class WarningHarness extends ComponentHarness {
  static readonly hostSelector = 'ix-warning';

  async getText(): Promise<string> {
    const warning = await this.locatorFor('.warning')();
    return warning.text();
  }
}
