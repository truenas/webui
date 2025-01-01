import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { ArrayDataProvider } from 'app/modules/ix-table/classes/array-data-provider/array-data-provider';
import { IxHeaderCellCheckboxComponent } from 'app/modules/ix-table/components/ix-table-head/head-cells/ix-header-cell-checkbox/ix-header-cell-checkbox.component';

interface TestTableData { booleanField: boolean }

describe('IxHeaderCellCheckboxComponent', () => {
  let spectator: Spectator<IxHeaderCellCheckboxComponent<TestTableData>>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: IxHeaderCellCheckboxComponent<TestTableData>,
    detectChanges: false,
  });

  beforeEach(() => {
    const dataProvider = new ArrayDataProvider<TestTableData>();
    dataProvider.setRows([
      { booleanField: true },
      { booleanField: false },
      { booleanField: true },
    ]);

    spectator = createComponent();
    spectator.component.dataProvider = dataProvider;
    spectator.component.propertyName = 'booleanField';
    spectator.component.title = 'Select All';
    spectator.detectChanges();

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows title', () => {
    expect(spectator.query('span')!.textContent!.trim()).toBe('Select All');
  });

  it('sets value when checkbox is changed', async () => {
    spectator.component.onColumnCheck = jest.fn();

    const checkbox = await loader.getHarness(MatCheckboxHarness);
    expect(await checkbox.isChecked()).toBe(false);

    await checkbox.toggle();
    expect(await checkbox.isChecked()).toBe(true);
    expect(spectator.component.onColumnCheck).toHaveBeenCalledWith(true);

    await checkbox.toggle();
    expect(await checkbox.isChecked()).toBe(false);
    expect(spectator.component.onColumnCheck).toHaveBeenCalledWith(false);
  });

  it('sets checkbox when value is changed', async () => {
    const checkbox = await loader.getHarness(MatCheckboxHarness);
    expect(await checkbox.isChecked()).toBe(false);

    spectator.component.dataProvider!.setRows([
      { booleanField: true },
      { booleanField: true },
      { booleanField: true },
    ]);
    expect(await checkbox.isChecked()).toBe(true);

    spectator.component.dataProvider!.setRows([
      { booleanField: false },
      { booleanField: false },
      { booleanField: true },
    ]);
    expect(await checkbox.isChecked()).toBe(false);
  });
});
