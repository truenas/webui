import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { IxCellDateComponent } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-date/ix-cell-date.component';
import { IxTableModule } from 'app/modules/ix-table/ix-table.module';
import { LocaleService } from 'app/services/locale.service';

interface TestTableData { dateField: Date }

describe('IxCellDateComponent', () => {
  let spectator: Spectator<IxCellDateComponent<TestTableData>>;

  const createComponent = createComponentFactory({
    component: IxCellDateComponent<TestTableData>,
    imports: [IxTableModule],
    detectChanges: false,
    providers: [
      mockProvider(LocaleService, {
        timezone: 'America/Los_Angeles',
      }),
      mockProvider(Store, {
        select: () => of(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    spectator.component.propertyName = 'dateField';
    spectator.component.setRow({ dateField: new Date('2023-07-12 09:10:00') });
    spectator.component.rowTestId = () => '';
    spectator.detectChanges();
  });

  it('shows default format datetime in template', () => {
    expect(spectator.element.textContent.trim()).toBe('2023-07-11 23:10:00');
  });
});
