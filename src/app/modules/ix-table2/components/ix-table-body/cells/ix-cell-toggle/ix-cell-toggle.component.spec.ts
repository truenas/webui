import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatSlideToggleHarness } from '@angular/material/slide-toggle/testing';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { IxCellToggleComponent } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-toggle/ix-cell-toggle.component';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';

interface TestTableData { booleanField: boolean }

describe('IxCellToggleComponent', () => {
  let spectator: Spectator<IxCellToggleComponent<TestTableData>>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: IxCellToggleComponent<TestTableData>,
    imports: [IxTable2Module],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        propertyName: 'booleanField',
        onRowToggle: () => jest.fn(),
      },
    });
    spectator.component.setRow({ booleanField: true });
    spectator.fixture.detectChanges();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('calls "onRowToggle" method when toggle is chenged', async () => {
    jest.spyOn(spectator.component, 'onRowToggle');
    const toggle = await loader.getHarness(MatSlideToggleHarness);

    expect(await toggle.isChecked()).toBe(true);
    await toggle.toggle();
    expect(await toggle.isChecked()).toBe(false);

    expect(spectator.component.onRowToggle).toHaveBeenCalledWith({ booleanField: true }, false);
  });
});
