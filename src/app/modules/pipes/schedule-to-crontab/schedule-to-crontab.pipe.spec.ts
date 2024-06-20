import { SpectatorPipe, createPipeFactory } from '@ngneat/spectator';
import { Schedule } from 'app/interfaces/schedule.interface';
import { ScheduleToCrontabPipe } from 'app/modules/pipes/schedule-to-crontab/schedule-to-crontab.pipe';

describe('ScheduleToCrontabPipe', () => {
  let spectator: SpectatorPipe<ScheduleToCrontabPipe>;

  const schedule: Schedule = {
    minute: '15',
    hour: '10',
    dom: '*',
    dow: '6',
    month: '2-5',
  };

  const createPipe = createPipeFactory({
    pipe: ScheduleToCrontabPipe,
  });

  it('transforms schedule object into crontab string', () => {
    spectator = createPipe('{{ inputValue | scheduleToCrontab }}', {
      hostProps: {
        inputValue: schedule,
      },
    });

    expect(spectator.element.innerHTML).toBe('15 10 * 2-5 6');
  });
});
