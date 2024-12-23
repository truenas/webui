import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { IxHeaderCellTextComponent } from 'app/modules/ix-table/components/ix-table-head/head-cells/ix-header-cell-text/ix-header-cell-text.component';

interface TestTableData { stringField: string }

describe('IxHeaderCellTextComponent', () => {
  let spectator: Spectator<IxHeaderCellTextComponent<TestTableData>>;

  const createComponent = createComponentFactory({
    component: IxHeaderCellTextComponent<TestTableData>,
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    spectator.component.title = 'Test Column';
    spectator.detectChanges();
  });

  it('shows title', () => {
    expect(spectator.element.textContent!.trim()).toBe('Test Column');
  });
});
