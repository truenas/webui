import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { IxCellCheckboxComponent } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-checkbox/ix-cell-checkbox.component';

interface TestTableData { booleanField: boolean }

describe('IxCellCheckboxComponent', () => {
  let spectator: Spectator<IxCellCheckboxComponent<TestTableData>>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: IxCellCheckboxComponent<TestTableData>,
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    spectator.component.propertyName = 'booleanField';
    spectator.component.setRow({ booleanField: true });
    spectator.component.uniqueRowTag = (row) => 'checkbox-' + row.booleanField.toString();
    spectator.component.ariaLabels = () => ['Label 1', 'Label 2'];
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

  it('gets aria label correctly', async () => {
    const checkbox = await loader.getHarness(MatCheckboxHarness);
    const ariaLabel = await checkbox.getAriaLabel();
    expect(ariaLabel).toBe('Uncheck Label 1 Label 2');
  });
});
