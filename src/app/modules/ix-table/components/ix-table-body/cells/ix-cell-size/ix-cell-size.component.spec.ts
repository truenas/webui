import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { IxCellSizeComponent } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-size/ix-cell-size.component';
import { IxTableModule } from 'app/modules/ix-table/ix-table.module';

interface TestTableData { numberField: number }

describe('IxCellSizeComponent', () => {
  let spectator: Spectator<IxCellSizeComponent<TestTableData>>;

  const createComponent = createComponentFactory({
    component: IxCellSizeComponent<TestTableData>,
    detectChanges: false,
    imports: [IxTableModule],
  });

  beforeEach(() => {
    spectator = createComponent();
    spectator.component.propertyName = 'numberField';
    spectator.component.setRow({ numberField: 5 * 1024 * 1024 * 1024 });
    spectator.component.rowTestId = () => '';
    spectator.detectChanges();
  });

  it('shows file size in template', () => {
    expect(spectator.element.textContent.trim()).toBe('5 GiB');
  });
});
