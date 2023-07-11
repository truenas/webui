import { ContentContainerComponentHarness } from '@angular/cdk/testing';

export class IxCellHarness extends ContentContainerComponentHarness {
  static hostSelector = '.row td, th';

  async getText(): Promise<string> {
    const host = await this.host();
    return host.text();
  }
}
