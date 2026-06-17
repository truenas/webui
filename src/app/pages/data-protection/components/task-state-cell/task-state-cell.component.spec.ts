import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { DisplayableState, JobState } from 'app/enums/job-state.enum';
import { TaskState } from 'app/enums/task-state.enum';
import { Job } from 'app/interfaces/job.interface';
import { ShowLogsDialog } from 'app/modules/dialog/components/show-logs-dialog/show-logs-dialog.component';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  TaskStateCellComponent,
} from 'app/pages/data-protection/components/task-state-cell/task-state-cell.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { FailedJobError } from 'app/services/errors/error.classes';

describe('TaskStateCellComponent', () => {
  let spectator: Spectator<TaskStateCellComponent>;

  const createComponent = createComponentFactory({
    component: TaskStateCellComponent,
    providers: [
      provideMockStore(),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({ afterClosed: () => of(undefined) })) as unknown as DialogService['jobDialog'],
      }),
      mockProvider(MatDialog, { open: jest.fn() }),
      mockProvider(ErrorHandlerService),
    ],
  });

  function setup(props: Partial<{ state: DisplayableState | null; job: Job | null }>): void {
    spectator = createComponent({
      props: {
        state: props.state ?? null,
        job: props.job ?? null,
        testId: ['state', 'row-state'],
        ariaLabel: 'My Task',
      },
    });
  }

  it('renders the displayable state inside a button', () => {
    setup({ state: JobState.Success });
    const button = spectator.query('button.state-button');
    expect(button).toExist();
    expect(button).toHaveText('Completed');
  });

  it('renders N/A when there is no state', () => {
    setup({ state: null });
    expect(spectator.query('button.state-button')).not.toExist();
    expect(spectator.element).toHaveText('N/A');
  });

  it('folds the state into the accessible name so status is not conveyed by colour alone', () => {
    setup({ state: JobState.Success });
    expect(spectator.query('button.state-button')).toHaveAttribute('aria-label', 'My Task, Completed');
  });

  it('shows the failed-job error modal when the job carries an error', () => {
    const job = { id: 1, state: JobState.Failed, error: 'boom' } as Job;
    setup({ state: JobState.Failed, job });

    spectator.click('button.state-button');

    expect(spectator.inject(ErrorHandlerService).showErrorModal)
      .toHaveBeenCalledWith(new FailedJobError(job));
  });

  it('opens the logs dialog when the job has logs', () => {
    const job = { id: 1, state: JobState.Failed, logs_excerpt: 'boom' } as Job;
    setup({ state: JobState.Failed, job });

    spectator.click('button.state-button');

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(ShowLogsDialog, { data: job });
  });

  it('warns when there are no logs to show', () => {
    setup({ state: JobState.Success, job: { id: 1, state: JobState.Success } as Job });

    spectator.click('button.state-button');

    expect(spectator.inject(DialogService).warn).toHaveBeenCalled();
  });

  it('opens the running-job dialog when the job is running', () => {
    setup({ state: JobState.Running, job: { id: 1, state: JobState.Running } as Job });

    spectator.click('button.state-button');

    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
  });

  it('shows an info dialog when the task is on hold', () => {
    setup({ state: TaskState.Hold });

    spectator.click('button.state-button');

    expect(spectator.inject(DialogService).info).toHaveBeenCalledWith('Task is on hold', '');
  });
});
