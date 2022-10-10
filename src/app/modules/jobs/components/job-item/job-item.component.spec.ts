import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockPipe } from 'ng-mocks';
import { CoreComponents } from 'app/core/core-components.module';
import { FormatDateTimePipe } from 'app/core/pipes/format-datetime.pipe';
import { mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';
import { JobItemComponent } from 'app/modules/jobs/components/job-item/job-item.component';
import { selectGeneralConfig } from 'app/store/system-config/system-config.selectors';

describe('JobItemComponent', () => {
  let spectator: Spectator<JobItemComponent>;

  const createComponent = createComponentFactory({
    component: JobItemComponent,
    imports: [
      CoreComponents,
    ],
    declarations: [
      MockPipe(FormatDateTimePipe, jest.fn(() => 'Jan 10 2022 10:36')),
    ],
    providers: [
      mockWebsocket(),
      provideMockStore({
        selectors: [
          { selector: selectGeneralConfig, value: { timezone: 'UTC' } },
        ],
      }),
    ],
  });

  it('shows running job', () => {
    spectator = createComponent({
      props: {
        job: {
          method: 'cloudsync.sync',
          progress: {
            percent: 99,
            description: 'progress description',
          },
          state: JobState.Running,
          abortable: true,
        } as Job,
      },
    });

    expect(spectator.query('.job-description')).toHaveText('cloudsync.sync');
    expect(spectator.query('.job-progress-description')).toHaveText('progress description');
    expect(spectator.query('.job-icon-abort')).toBeTruthy();
    expect(spectator.query('.job-icon-failed')).toBeFalsy();
  });

  it('shows failed job', () => {
    spectator = createComponent({
      props: {
        job: {
          method: 'cloudsync.sync',
          progress: {
            percent: 0,
          },
          state: JobState.Failed,
          time_finished: {
            $date: 1641811015,
          },
          error: 'Broken pipe',
        } as Job,
        clickable: true,
      },
    });

    expect(spectator.query('.job-description')).toHaveText('cloudsync.sync');
    expect(spectator.query('.job-time')).toHaveText('Stopped:  Jan 10 2022 10:36');
    expect(spectator.query('.job-icon-failed')).toBeTruthy();
  });

  it('checks "aborted" event has been emitted if user click the abort button', () => {
    spectator = createComponent({
      props: {
        job: {
          method: 'cloudsync.sync',
          progress: {
            percent: 99,
            description: 'progress description',
          },
          state: JobState.Running,
          abortable: true,
        } as Job,
      },
    });
    jest.spyOn(spectator.component.aborted, 'emit').mockImplementation();

    spectator.click(spectator.query('.job-button-abort'));

    expect(spectator.component.aborted.emit).toHaveBeenCalledTimes(1);
  });

  it('checks "opened" event has been emitted if user click on the job', () => {
    spectator = createComponent({
      props: {
        job: {
          method: 'cloudsync.sync',
          progress: {
            percent: 99,
            description: 'progress description',
          },
          state: JobState.Running,
          abortable: true,
        } as Job,
        clickable: true,
      },
    });
    jest.spyOn(spectator.component.opened, 'emit').mockImplementation();

    spectator.click(spectator.query('.job-item-body'));

    expect(spectator.component.opened.emit).toHaveBeenCalledTimes(1);
  });
});
