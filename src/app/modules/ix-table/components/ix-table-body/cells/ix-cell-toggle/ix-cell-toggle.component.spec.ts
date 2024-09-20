import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatSlideToggleHarness } from '@angular/material/slide-toggle/testing';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { IxCellToggleComponent } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-toggle/ix-cell-toggle.component';

interface TestTableData { booleanField: boolean }

describe('IxCellToggleComponent', () => {
  let spectator: Spectator<IxCellToggleComponent<TestTableData>>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: IxCellToggleComponent<TestTableData>,
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    spectator.component.propertyName = 'booleanField';
    spectator.component.setRow({ booleanField: true });
    spectator.component.onRowToggle = jest.fn();
    spectator.component.uniqueRowTag = (row) => row.booleanField.toString();
    spectator.component.ariaLabels = () => ['Label 1', 'Label 2'];
    spectator.detectChanges();

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('calls "onRowToggle" method when toggle is changed', async () => {
    jest.spyOn(spectator.component, 'onRowToggle');
    const toggle = await loader.getHarness(MatSlideToggleHarness);

    expect(await toggle.isChecked()).toBe(true);
    await toggle.toggle();
    expect(await toggle.isChecked()).toBe(false);

    expect(spectator.component.onRowToggle)
      .toHaveBeenCalledWith({ booleanField: true }, false, expect.any(MatSlideToggle));
  });

  it('gets aria label correctly', async () => {
    const toggle = await loader.getHarness(MatSlideToggleHarness);

    expect(await toggle.getAriaLabel()).toBe('Disable Label 1 Label 2');
  });
});
