import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { oneDayMillis } from 'app/constants/time.constant';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { IxCellRelativeDateComponent } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-relative-date/ix-cell-relative-date.component';

interface TestTableData { dateField: Date }

describe('IxCellRelativeDateComponent', () => {
  let spectator: Spectator<IxCellRelativeDateComponent<TestTableData>>;

  const createComponent = createComponentFactory({
    component: IxCellRelativeDateComponent<TestTableData>,
    detectChanges: false,
    imports: [FakeFormatDateTimePipe],
    providers: [
      mockProvider(Store, {
        select: () => of(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    spectator.component.propertyName = 'dateField';
    spectator.component.setRow({ dateField: new Date(new Date().getTime() - (oneDayMillis * 10)) });
    spectator.component.uniqueRowTag = () => '';
    spectator.detectChanges();
  });

  it('shows custom relative format datetime in template', () => {
    expect(spectator.element.textContent!.trim()).toBe('10 days ago');
  });
});
