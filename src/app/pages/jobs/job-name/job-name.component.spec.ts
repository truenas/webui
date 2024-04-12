import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { CopyButtonComponent } from 'app/core/components/copy-btn/copy-btn.component';
import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { JobNameComponent } from 'app/pages/jobs/job-name/job-name.component';

const failedJob = {
  id: 446,
  abortable: true,
  description: null,
  error: '[EFAULT] Transferred:   \t          0 / 0 Byte, -, 0 Byte/s, ETA',
  method: 'cloudsync.sync',
  progress: {
    description: 'Starting',
    extra: null,
    percent: 0,
  },
  state: JobState.Failed,
} as Job;

describe('JobNameComponent', () => {
  let spectator: Spectator<JobNameComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: JobNameComponent,
    declarations: [
      CopyButtonComponent,
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: { job: failedJob },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('checks failed job icon and text', async () => {
    const icon = await loader.getHarness(IxIconHarness.with({ name: 'highlight_off' }));
    expect(icon).toBeTruthy();
    expect(spectator.query('.job-name')).toHaveText('cloudsync.sync');
  });

  // TODO: Add more tests
});
