import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { IxCellDateComponent } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-date/ix-cell-date.component';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';

interface TestTableData { dateField: Date }

describe('IxCellDateComponent', () => {
  let spectator: Spectator<IxCellDateComponent<TestTableData>>;

  const createComponent = createComponentFactory({
    component: IxCellDateComponent<TestTableData>,
    imports: [IxTable2Module],
    detectChanges: false,
    providers: [
      mockProvider(Store, {
        select: () => of(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        propertyName: 'dateField',
      },
    });
    spectator.component.setRow({ dateField: new Date('2023-07-12 09:10:00') });
    spectator.fixture.detectChanges();
  });

  it('shows default format datetime in template', () => {
    expect(spectator.element.textContent.trim()).toBe('2023-07-12 09:10:00');
  });

  it('shows custom format datetime in template', () => {
    spectator.component.formatDate = 'yyyy/MM/dd';
    spectator.component.formatTime = 'HH.mm.ss';
    spectator.fixture.detectChanges();

    expect(spectator.element.textContent.trim()).toBe('2023/07/12 09.10.00');
  });
});
