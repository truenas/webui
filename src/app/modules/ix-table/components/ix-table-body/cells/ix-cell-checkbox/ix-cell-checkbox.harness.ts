import { ContentContainerComponentHarness } from '@angular/cdk/testing';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';

export class IxCellCheckboxHarness extends ContentContainerComponentHarness {
  static readonly hostSelector = 'ix-cell-checkbox';

  async check(): Promise<void> {
    const checkbox = await this.getHarness(MatCheckboxHarness);
    await checkbox.check();
  }
}
