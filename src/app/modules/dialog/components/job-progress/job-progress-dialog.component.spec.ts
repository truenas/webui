import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDialogHarness } from '@angular/material/dialog/testing';
import { MatProgressBarHarness } from '@angular/material/progress-bar/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { BehaviorSubject, of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';
import {
  JobProgressDialogComponent,
  JobProgressDialogConfig,
} from 'app/modules/dialog/components/job-progress/job-progress-dialog.component';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { ApiService } from 'app/modules/websocket/api.service';

describe('JobProgressDialogComponent', () => {
  let spectator: Spectator<JobProgressDialogComponent<unknown>>;
  let loader: HarnessLoader;
  let dialogHarness: MatDialogHarness;

  const createComponent = createComponentFactory({
    component: JobProgressDialogComponent<unknown>,
    providers: [
      mockApi([
        mockCall('core.job_abort', null),
      ]),
      mockProvider(MatDialogRef),
    ],
  });

  const testJob = {
    id: 23,
    state: JobState.Running,
    method: 'pool.create',
    description: 'Creating pool',
    abortable: false,
    progress: {
      percent: 50,
    },
  } as Job;

  async function setupTest(data: Partial<JobProgressDialogConfig<unknown>> = {}): Promise<void> {
    spectator = createComponent({
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            job$: of(testJob),
            ...data,
          } as JobProgressDialogConfig<unknown>,
        },
      ],
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    dialogHarness = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, MatDialogHarness);
  }

  it('shows title from data when it is provided', async () => {
    await setupTest({
      title: 'Test job',
    });
    expect(await dialogHarness.getTitleText()).toBe('Test job');
  });

  it('shows description from data when it is provided', async () => {
    await setupTest({
      description: 'Test description',
    });
    expect(spectator.query('.job-description')).toHaveExactText('Test description');
  });

  it('uses job method as a title when title is not provided', async () => {
    await setupTest();
    expect(await dialogHarness.getTitleText()).toBe('pool.create');
  });

  it('shows a progress bar with a percentage once job is active', async () => {
    await setupTest();
    const progressBar = await loader.getHarness(MatProgressBarHarness);

    expect(await progressBar.getValue()).toBe(50);
  });

  it('should update job description and progress when job updates', async () => {
    await setupTest({
      job$: of({
        ...testJob,
        progress: {
          percent: 74,
          description: 'Confabulating bits',
        },
      } as Job),
    });

    const progressBar = await loader.getHarness(MatProgressBarHarness);
    expect(await progressBar.getValue()).toBe(74);
    expect(spectator.query('.job-description')).toHaveExactText('Confabulating bits');
  });

  it('should emit jobProgress when job progress update is received', async () => {
    const job$ = new BehaviorSubject(testJob);
    await setupTest({ job$ });
    const emitSpy = jest.spyOn(spectator.component.jobProgress, 'emit');
    const newProgress = {
      percent: 74,
      description: 'Confabulating bits',
    };
    const newJob = {
      ...testJob,
      progress: newProgress,
    } as Job;
    job$.next(newJob);

    expect(emitSpy).toHaveBeenCalledWith(newProgress);
  });

  it('should emit jobSuccess and close when job state is Success', async () => {
    const job$ = new BehaviorSubject(testJob);
    await setupTest({ job$ });
    const emitSpy = jest.spyOn(spectator.component.jobSuccess, 'emit');
    const newJob = {
      ...testJob,
      state: JobState.Success,
    } as Job;
    job$.next(newJob);
    job$.complete();

    expect(emitSpy).toHaveBeenCalledWith(newJob);
    job$.complete();
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
  });

  it('should emit jobFailure and close when job state is Failed', async () => {
    const job$ = new BehaviorSubject(testJob);
    await setupTest({ job$ });
    const emitSpy = jest.spyOn(spectator.component.jobFailure, 'emit');
    const newJob = {
      ...testJob,
      state: JobState.Failed,
    } as Job;
    job$.next(newJob);
    job$.complete();

    expect(emitSpy).toHaveBeenCalledWith(newJob);
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
  });

  describe('aborting', () => {
    const job$ = new BehaviorSubject({
      ...testJob,
      abortable: true,
    } as Job);

    beforeEach(async () => {
      await setupTest({ job$ });
    });

    it('should show an Abort button for abortable jobs', async () => {
      expect(await loader.getHarness(MatButtonHarness.with({ text: 'Abort' }))).toBeTruthy();
    });

    it('makes a call to abort a job when Abort button is clicked', async () => {
      const abortButton = await loader.getHarness(MatButtonHarness.with({ text: 'Abort' }));
      await abortButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('core.job_abort', [testJob.id]);
    });

    it('emits jobAborted and closes when job update from middleware shows that it was aborted', () => {
      const emitSpy = jest.spyOn(spectator.component.jobAborted, 'emit');
      const newJob = {
        ...testJob,
        state: JobState.Aborted,
      } as Job;
      job$.next(newJob);
      job$.complete();

      expect(emitSpy).toHaveBeenCalledWith(newJob);
      expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
    });
  });

  it('allows to minimize (close) the job dialog when canMinimize is true', async () => {
    await setupTest({
      canMinimize: true,
    });

    const minimizeButton = await loader.getHarness(IxIconHarness.with({ name: 'remove' }));
    await minimizeButton.click();

    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
  });

  it('does not allow dialog to be closed by clicking on the backdrop if dialog cannot be minimized', async () => {
    await setupTest({
      canMinimize: true,
    });

    expect(spectator.inject(MatDialogRef).disableClose).toBe(false);
  });

  // TODO: Test cases for realtime jobs.
});
