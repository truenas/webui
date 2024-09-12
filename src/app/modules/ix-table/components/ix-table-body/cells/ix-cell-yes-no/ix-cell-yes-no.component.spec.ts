import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { IxCellYesNoComponent } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-yes-no/ix-cell-yes-no.component';
import { IxTableModule } from 'app/modules/ix-table/ix-table.module';

interface TestTableData { yesNoField: boolean }

describe('IxCellYesNoComponent', () => {
  let spectator: Spectator<IxCellYesNoComponent<TestTableData>>;

  const createComponent = createComponentFactory({
    component: IxCellYesNoComponent<TestTableData>,
    detectChanges: false,
    imports: [IxTableModule],
  });

  beforeEach(() => {
    spectator = createComponent();
    spectator.component.propertyName = 'yesNoField';
    spectator.component.setRow({ yesNoField: true });
    spectator.component.uniqueRowTag = (row) => row.yesNoField.toString();
    spectator.detectChanges();
  });

  it('shows "Yes" when "true"', () => {
    expect(spectator.element.textContent.trim()).toBe('Yes');
  });

  it('shows "No" when "false"', () => {
    spectator.component.setRow({ yesNoField: false });
    spectator.detectComponentChanges();
    expect(spectator.element.textContent.trim()).toBe('No');
  });
});
