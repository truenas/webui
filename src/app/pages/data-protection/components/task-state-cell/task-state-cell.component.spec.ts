import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';
import { ShowLogsDialog } from 'app/modules/dialog/components/show-logs-dialog/show-logs-dialog.component';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  TaskStateCellComponent,
} from 'app/pages/data-protection/components/task-state-cell/task-state-cell.component';

describe('TaskStateCellComponent', () => {
  let spectator: Spectator<TaskStateCellComponent>;

  const createComponent = createComponentFactory({
    component: TaskStateCellComponent,
    providers: [
      provideMockStore(),
      mockProvider(DialogService),
      mockProvider(MatDialog, { open: jest.fn() }),
    ],
  });

  function setup(props: Partial<{ state: JobState | null; job: Job | null }>): void {
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
});
