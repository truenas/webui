import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { IxCellCheckboxComponent } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-checkbox/ix-cell-checkbox.component';
import { IxTableModule } from 'app/modules/ix-table/ix-table.module';

interface TestTableData { booleanField: boolean }

describe('IxCellCheckboxComponent', () => {
  let spectator: Spectator<IxCellCheckboxComponent<TestTableData>>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: IxCellCheckboxComponent<TestTableData>,
    detectChanges: false,
    imports: [IxTableModule],
  });

  beforeEach(() => {
    spectator = createComponent();
    spectator.component.propertyName = 'booleanField';
    spectator.component.setRow({ booleanField: true });
    spectator.component.rowTestId = (row) => 'checkbox-' + row.booleanField.toString();
    spectator.detectChanges();

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('sets value when checkbox is changed', async () => {
    spectator.component.onRowCheck = jest.fn();
    const checkbox = await loader.getHarness(MatCheckboxHarness);

    expect(await checkbox.isChecked()).toBe(true);
    await checkbox.toggle();

    expect(await checkbox.isChecked()).toBe(false);
    expect(spectator.component.onRowCheck).toHaveBeenCalledWith({ booleanField: true }, false);
  });
});
