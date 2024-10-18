import { ContentContainerComponentHarness } from '@angular/cdk/testing';

export class IxCellHarness extends ContentContainerComponentHarness {
  // TODO: Incorrect number of header cells when expand row icon is there.
  static readonly hostSelector = '.row td:not(.toggle-cell), th';

  async getText(): Promise<string> {
    const host = await this.host();
    return host.text();
  }
}
