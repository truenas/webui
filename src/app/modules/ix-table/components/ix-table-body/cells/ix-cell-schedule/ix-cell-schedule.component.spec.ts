import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { Schedule } from 'app/interfaces/schedule.interface';
import { IxCellScheduleComponent } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-schedule/ix-cell-schedule.component';
import { LanguageService } from 'app/modules/language/language.service';
import { LocaleService } from 'app/modules/language/locale.service';

interface TestTableData { scheduleField: Schedule }

describe('IxCellScheduleComponent', () => {
  let spectator: Spectator<IxCellScheduleComponent<TestTableData>>;
  const schedule: Schedule = {
    minute: '15',
    hour: '10',
    dom: '*',
    dow: '6',
    month: '2-5',
  };

  const createComponent = createComponentFactory({
    component: IxCellScheduleComponent<TestTableData>,
    detectChanges: false,
    providers: [
      mockProvider(LocaleService, {
        getShortTimeFormat: () => 'HH:mm',
        getPreferredTimeFormat: () => 'HH:mm:ss',
      }),
      mockProvider(LanguageService, {
        currentLanguage: 'en',
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    spectator.component.propertyName = 'scheduleField';
    spectator.component.setRow({ scheduleField: schedule });
    spectator.component.uniqueRowTag = () => '';
    spectator.detectChanges();
  });

  it('shows crontab string when schedule is passed', () => {
    spectator.component.setRow({ scheduleField: schedule });
    spectator.fixture.detectChanges();
    expect(spectator.element.textContent!.trim()).toBe('At 10:15, only on Saturday, February through May');
  });
});
