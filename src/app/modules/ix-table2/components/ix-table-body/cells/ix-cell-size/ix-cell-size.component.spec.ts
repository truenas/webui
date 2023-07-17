import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { IxCellSizeComponent } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-size/ix-cell-size.component';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';

interface TestTableData { numberField: number }

describe('IxCellSizeComponent', () => {
  let spectator: Spectator<IxCellSizeComponent<TestTableData>>;

  const createComponent = createComponentFactory({
    component: IxCellSizeComponent<TestTableData>,
    imports: [IxTable2Module],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        propertyName: 'numberField',
      },
    });
    spectator.component.setRow({ numberField: 5 * 1024 * 1024 * 1024 });
    spectator.fixture.detectChanges();
  });

  it('shows filesize in template', () => {
    expect(spectator.element.textContent.trim()).toBe('5 GiB');
  });
});
