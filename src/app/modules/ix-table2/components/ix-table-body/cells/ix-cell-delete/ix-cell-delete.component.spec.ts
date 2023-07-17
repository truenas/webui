import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { IxCellDeleteComponent } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-delete/ix-cell-delete.component';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';

interface TestTableData { numberField: number }

describe('IxCellDeleteComponent', () => {
  let spectator: Spectator<IxCellDeleteComponent<TestTableData>>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: IxCellDeleteComponent<TestTableData>,
    imports: [IxTable2Module],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        propertyName: 'numberField',
        onRowDelete: () => jest.fn(),
      },
    });
    spectator.component.setRow({ numberField: 1 });
    spectator.fixture.detectChanges();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('calls "onRowDelete" method when delete is pressed', async () => {
    jest.spyOn(spectator.component, 'onRowDelete');
    const deleteButton = await loader.getHarness(MatButtonHarness);
    await deleteButton.click();

    expect(spectator.component.onRowDelete).toHaveBeenCalledWith({ numberField: 1 });
  });
});
