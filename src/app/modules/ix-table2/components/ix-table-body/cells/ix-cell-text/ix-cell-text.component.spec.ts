import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { IxCellTextComponent } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';

interface TestTableData { stringField: string }

describe('IxCellTextComponent', () => {
  let spectator: Spectator<IxCellTextComponent<TestTableData>>;

  const createComponent = createComponentFactory({
    component: IxCellTextComponent<TestTableData>,
    detectChanges: false,
    imports: [IxTable2Module],
  });

  beforeEach(() => {
    spectator = createComponent();
    spectator.component.propertyName = 'stringField';
    spectator.component.setRow({ stringField: 'text in cell' });
    spectator.component.rowTestId = (row) => 'text-' + row.stringField.toString();
    spectator.detectChanges();
  });

  it('shows text in template', () => {
    expect(spectator.element.querySelector('span').textContent.trim()).toBe('text in cell');
  });
});
