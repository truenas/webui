import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { IxCellYesNoComponent } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-yesno/ix-cell-yesno.component';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';

interface TestTableData { yesNoField: boolean }

describe('IxCellYesNoComponent', () => {
  let spectator: Spectator<IxCellYesNoComponent<TestTableData>>;

  const createComponent = createComponentFactory({
    component: IxCellYesNoComponent<TestTableData>,
    imports: [IxTable2Module],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        propertyName: 'yesNoField',
        row: { yesNoField: true },
      } as Partial<IxCellYesNoComponent<TestTableData>>,
    });
  });

  it('shows "Yes" when "true"', () => {
    expect(spectator.element.textContent.trim()).toBe('Yes');
  });

  it('shows "No" when "false"', () => {
    spectator.component.setRow({ yesNoField: false });
    spectator.fixture.detectChanges();
    expect(spectator.element.textContent.trim()).toBe('No');
  });
});
