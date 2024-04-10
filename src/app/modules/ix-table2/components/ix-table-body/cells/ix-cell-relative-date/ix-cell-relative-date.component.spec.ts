import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { IxCellRelativeDateComponent } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-relative-date/ix-cell-relative-date.component';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';

interface TestTableData { dateField: Date }

describe('IxCellRelativeDateComponent', () => {
  let spectator: Spectator<IxCellRelativeDateComponent<TestTableData>>;

  const createComponent = createComponentFactory({
    component: IxCellRelativeDateComponent<TestTableData>,
    imports: [IxTable2Module],
    detectChanges: false,
    declarations: [FakeFormatDateTimePipe],
    providers: [
      mockProvider(Store, {
        select: () => of(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    spectator.component.propertyName = 'dateField';
    spectator.component.setRow({ dateField: new Date(new Date().getTime() - (24 * 60 * 60 * 10000)) });
    spectator.component.rowTestId = () => '';
    spectator.detectChanges();
  });

  it('shows custom relative format datetime in template', () => {
    expect(spectator.element.textContent.trim()).toBe('10 days ago');
  });
});
