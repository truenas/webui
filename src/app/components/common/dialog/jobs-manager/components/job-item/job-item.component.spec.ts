import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { JobItemComponent } from 'app/components/common/dialog/jobs-manager/components/job-item/job-item.component';
import { CoreComponents } from 'app/core/components/core-components.module';
import { FormatDateTimePipe } from 'app/core/components/pipes/format-datetime.pipe';
import { mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';
import { EntityModule } from 'app/pages/common/entity/entity.module';

describe('JobItemComponent', () => {
  let spectator: Spectator<JobItemComponent>;

  const createComponent = createComponentFactory({
    component: JobItemComponent,
    imports: [
      EntityModule,
      CoreComponents,
    ],
    providers: [
      FormatDateTimePipe,
      mockWebsocket(),
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

    expect(spectator.query('.job-description')).toHaveExactText('cloudsync.sync');
    expect(spectator.query('.job-progress-description')).toHaveExactText('progress description');
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
            $date: 1632411439082,
          },
          error: 'Broken pipe',
        } as Job,
      },
    });

    expect(spectator.query('.job-description')).toHaveExactText('cloudsync.sync');
    expect(spectator.query('.job-time')).toHaveText('Stopped: 2021-09-23 18:37:19');
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
      },
    });
    jest.spyOn(spectator.component.opened, 'emit').mockImplementation();

    spectator.click(spectator.query('.job-clickable'));

    expect(spectator.component.opened.emit).toHaveBeenCalledTimes(1);
  });
});
