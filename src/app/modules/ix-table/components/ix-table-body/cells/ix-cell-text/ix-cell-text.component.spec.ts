import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { IxCellTextComponent } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { IxTableModule } from 'app/modules/ix-table/ix-table.module';

interface TestTableData { stringField: string }

describe('IxCellTextComponent', () => {
  let spectator: Spectator<IxCellTextComponent<TestTableData>>;

  const createComponent = createComponentFactory({
    component: IxCellTextComponent<TestTableData>,
    detectChanges: false,
    imports: [IxTableModule],
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
