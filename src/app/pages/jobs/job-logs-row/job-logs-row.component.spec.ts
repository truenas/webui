import { createHostFactory, SpectatorHost } from '@ngneat/spectator/jest';
import { JobState } from 'app/enums/job-state.enum';
import { JobExceptionType } from 'app/enums/response-error-type.enum';
import { Job } from 'app/interfaces/job.interface';
import { CopyButtonComponent } from 'app/modules/buttons/copy-button/copy-button.component';
import { JobLogsRowComponent } from 'app/pages/jobs/job-logs-row/job-logs-row.component';

const fakeJob: Job = {
  abortable: true,
  arguments: [1],
  description: null,
  transient: false,
  error: '[EFAULT] Transferred:   \t          0 / 0 Byte, -, 0 Byte/s, ETA',
  exc_info: {
    extra: null,
    type: 'CallError' as JobExceptionType,
  },
  exception: 'Traceback (most recent call last):\n  File "/usr/lib/python3/dist-packages/middlewared/job.py", line 423',
  id: 446,
  logs_excerpt: "<3>ERROR : webdav root '': error reading source root directory: couldn't list files: Propfind \"http:192.168.3.133/\"",
  logs_path: '/var/log/jobs/446.log',
  method: 'cloudsync.sync',
  progress: {
    description: 'Starting',
    extra: null,
    percent: 0,
  },
  result: null,
  state: JobState.Failed,
  time_finished: { $date: 1653721201697 },
  time_started: { $date: 1653721201446 },
  credentials: null,
};

describe('JobLogsRowComponent', () => {
  let spectator: SpectatorHost<JobLogsRowComponent>;

  const createHost = createHostFactory({
    component: JobLogsRowComponent,
    imports: [
      CopyButtonComponent,
    ],
  });

  beforeEach(() => {
    spectator = createHost(
      '<ix-job-logs-row [job]="job"></ix-job-logs-row>',
      { hostProps: { job: fakeJob } },
    );
  });

  it('shows arguments and logs', () => {
    const [argument, logPath, logExcerpt, error] = spectator.queryAll('.list-item div');
    expect(argument).toHaveText('[\n  1\n]');
    expect(logPath).toHaveText('/var/log/jobs/446.log');
    expect(logExcerpt).toHaveText('<3>ERROR : webdav root \'\': error reading source root directory: couldn\'t list files: Propfind "http:192.168.3.133/"');
    expect(error).toHaveText('[EFAULT] Transferred:   \t          0 / 0 Byte, -, 0 Byte/s, ETA');
  });
});
