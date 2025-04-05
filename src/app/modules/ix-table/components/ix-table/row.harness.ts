import { ContentContainerComponentHarness } from '@angular/cdk/testing';
import {
  IxCellCheckboxHarness,
} from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-checkbox/ix-cell-checkbox.harness';

export class IxRowHarness extends ContentContainerComponentHarness {
  static readonly hostSelector = '.row';

  async check(): Promise<void> {
    const checkbox = await this.getHarness(IxCellCheckboxHarness);
    await checkbox.check();
  }
}
