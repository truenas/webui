import { ContentContainerComponentHarness, TestElement } from '@angular/cdk/testing';

export class IxCellHarness extends ContentContainerComponentHarness {
  // TODO: Incorrect number of header cells when expand row icon is there.
  static readonly hostSelector = '.row td:not(.toggle-cell), th';

  async getText(): Promise<string> {
    const host = await this.host();
    return host.text();
  }

  async getAnchorByText(text: string): Promise<TestElement | null> {
    const anchors = await this.locatorForAll('a')();
    for (const anchor of anchors) {
      const anchorText = (await anchor.text()).trim();
      if (anchorText === text) {
        return anchor;
      }
    }
    return null;
  }
}
