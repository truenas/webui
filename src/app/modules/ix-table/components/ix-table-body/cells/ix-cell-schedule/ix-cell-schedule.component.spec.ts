import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { Schedule } from 'app/interfaces/schedule.interface';
import { IxCellScheduleComponent } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-schedule/ix-cell-schedule.component';

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
    expect(spectator.element.textContent.trim()).toBe('15 10 * 2-5 6');
  });
});
