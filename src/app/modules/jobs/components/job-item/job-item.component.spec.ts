import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { JobState } from 'app/enums/job-state.enum';
import { CredentialType } from 'app/interfaces/credential-type.interface';
import { Job } from 'app/interfaces/job.interface';
import { JobItemComponent } from 'app/modules/jobs/components/job-item/job-item.component';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';

describe('JobItemComponent', () => {
  let spectator: Spectator<JobItemComponent>;

  const createComponent = createComponentFactory({
    component: JobItemComponent,
    declarations: [
      FakeFormatDateTimePipe,
    ],
    imports: [
      MapValuePipe,
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
    expect(spectator.query('.job-button-abort ix-icon')).toBeTruthy();
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
          credentials: {
            type: CredentialType.Token,
            data: {
              parent: {
                type: CredentialType.UnixSocket,
                data: {
                  username: 'root',
                },
              },
              username: 'root',
            },
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
    expect(spectator.query('.job-time')).toHaveText('Stopped:  1970-01-20 03:03:31');
    expect(spectator.query('.job-credentials')).toHaveText('Created by: root (Token)');
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

    spectator.click(spectator.query('.job-button-abort')!);

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
          credentials: {
            type: CredentialType.ApiKey,
            data: {
              api_key: 'testApiKey',
            },
          },
        } as Job,
        clickable: true,
      },
    });
    jest.spyOn(spectator.component.opened, 'emit').mockImplementation();

    spectator.click(spectator.query('.job-item-body')!);

    expect(spectator.component.opened.emit).toHaveBeenCalledTimes(1);

    expect(spectator.query('.job-credentials')).toHaveText('Created by: testApiKey (API Key)');
  });
});
