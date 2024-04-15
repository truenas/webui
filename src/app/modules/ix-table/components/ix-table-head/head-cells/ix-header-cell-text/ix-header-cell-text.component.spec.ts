import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { IxHeaderCellTextComponent } from 'app/modules/ix-table/components/ix-table-head/head-cells/ix-header-cell-text/ix-header-cell-text.component';
import { IxTableModule } from 'app/modules/ix-table/ix-table.module';

interface TestTableData { stringField: string }

describe('IxHeaderCellTextComponent', () => {
  let spectator: Spectator<IxHeaderCellTextComponent<TestTableData>>;

  const createComponent = createComponentFactory({
    component: IxHeaderCellTextComponent<TestTableData>,
    imports: [IxTableModule],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    spectator.component.title = 'Test Column';
    spectator.detectChanges();
  });

  it('shows title', () => {
    expect(spectator.element.textContent.trim()).toBe('Test Column');
  });
});
