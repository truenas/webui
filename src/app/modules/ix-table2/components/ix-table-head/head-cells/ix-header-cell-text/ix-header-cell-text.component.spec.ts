import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { IxHeaderCellTextComponent } from 'app/modules/ix-table2/components/ix-table-head/head-cells/ix-header-cell-text/ix-header-cell-text.component';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';

interface TestTableData { stringField: string }

describe('IxHeaderCellTextComponent', () => {
  let spectator: Spectator<IxHeaderCellTextComponent<TestTableData>>;

  const createComponent = createComponentFactory({
    component: IxHeaderCellTextComponent<TestTableData>,
    imports: [IxTable2Module],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        title: 'Test Column',
      },
    });
  });

  it('shows title', () => {
    expect(spectator.element.textContent.trim()).toBe('Test Column');
  });
});
