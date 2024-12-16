import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatProgressBarHarness } from '@angular/material/progress-bar/testing';
import { MatProgressSpinnerHarness } from '@angular/material/progress-spinner/testing';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';
import { CopyButtonComponent } from 'app/modules/buttons/copy-button/copy-button.component';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { abortJobPressed } from 'app/modules/jobs/store/job.actions';
import { JobNameComponent } from 'app/pages/jobs/job-name/job-name.component';

const job = {
  id: 446,
  state: JobState.Failed,
} as Job;

describe('JobNameComponent', () => {
  let spectator: Spectator<JobNameComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: JobNameComponent,
    imports: [
      CopyButtonComponent,
    ],
    providers: [
      mockProvider(Store, {
        dispatch: jest.fn(),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => {
          return of(true);
        }),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: { job },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  describe('rendering', () => {
    it('shows correct icon based on job status', async () => {
      let icon: IxIconHarness;

      // Success
      spectator.setInput('job', { ...job, state: JobState.Success });
      icon = await loader.getHarness(IxIconHarness.with({ ancestor: '.job-icon' }));
      expect(await icon.getName()).toBe('check_circle_outline');

      // Failed
      spectator.setInput('job', { ...job, state: JobState.Failed });
      icon = await loader.getHarness(IxIconHarness.with({ ancestor: '.job-icon' }));
      expect(await icon.getName()).toBe('highlight_off');

      // Waiting
      spectator.setInput('job', { ...job, state: JobState.Waiting });
      icon = await loader.getHarness(IxIconHarness.with({ ancestor: '.job-icon' }));
      expect(await icon.getName()).toBe('schedule');

      // Aborted
      spectator.setInput('job', { ...job, state: JobState.Aborted });
      icon = await loader.getHarness(IxIconHarness.with({ ancestor: '.job-icon' }));
      expect(await icon.getName()).toBe('report');
    });

    it('shows job description if it is available', () => {
      spectator.setInput('job', { ...job, description: 'Deleting all files...' });
      expect(spectator.query('.job-name')).toHaveText('Deleting all files...');
    });

    it('shows job method when description is not available', () => {
      spectator.setInput('job', { ...job, method: 'cloudsync.sync' });
      expect(spectator.query('.job-name')).toHaveText('cloudsync.sync');
    });
  });

  describe('running job', () => {
    const runningJob = {
      ...job,
      state: JobState.Running,
      abortable: true,
      progress: {
        percent: 50,
        description: '50%',
      },
    } as Job;

    beforeEach(() => {
      spectator.setInput('job', runningJob);
    });

    it('shows progress bar when job is running', async () => {
      const progressBar = await loader.getHarness(MatProgressBarHarness);
      expect(progressBar).toBeTruthy();
      expect(await progressBar.getValue()).toBe(50);
    });

    it('shows job percentage when job is running', () => {
      expect(spectator.query('.job-name')).toHaveText('50.00%');
    });

    it('shows a spinner when job is running', async () => {
      const spinner = await loader.getHarness(MatProgressSpinnerHarness);
      expect(spinner).toBeTruthy();
    });

    it('allows to abort a job when it is in running state and is abortable', async () => {
      const abortIcon = await loader.getHarness(IxIconHarness.with({ name: 'mdi-close-circle' }));
      await abortIcon.click();

      expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Abort',
        }),
      );
      expect(spectator.inject(Store).dispatch).toHaveBeenCalledWith(abortJobPressed({ job: runningJob }));
    });
  });
});
