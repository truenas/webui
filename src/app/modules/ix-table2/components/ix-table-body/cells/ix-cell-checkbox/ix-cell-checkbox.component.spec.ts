import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { IxCellCheckboxComponent } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-checkbox/ix-cell-checkbox.component';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';

interface TestTableData { booleanField: boolean }

describe('IxCellCheckboxComponent', () => {
  let spectator: Spectator<IxCellCheckboxComponent<TestTableData>>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: IxCellCheckboxComponent<TestTableData>,
    imports: [IxTable2Module],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        propertyName: 'booleanField',
        row: { booleanField: true },
      } as Partial<IxCellCheckboxComponent<TestTableData>>,
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('sets value when checkbox is changed', async () => {
    const checkbox = await loader.getHarness(MatCheckboxHarness);

    expect(await checkbox.isChecked()).toBe(true);
    expect(spectator.component.getRow().booleanField).toBe(true);

    await checkbox.toggle();

    expect(await checkbox.isChecked()).toBe(false);
    expect(spectator.component.getRow().booleanField).toBe(false);
  });
});
