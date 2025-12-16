import { SpectatorPipe, createPipeFactory } from '@ngneat/spectator/jest';
import { JobState } from 'app/enums/job-state.enum';
import { TaskState } from 'app/enums/task-state.enum';
import { JobStateDisplayPipe } from './job-state-display.pipe';

describe('JobStateDisplayPipe', () => {
  let spectator: SpectatorPipe<JobStateDisplayPipe>;
  const createPipe = createPipeFactory({
    pipe: JobStateDisplayPipe,
  });

  it('normalizes JobState.Success to Completed', () => {
    spectator = createPipe(`{{ '${JobState.Success}' | jobStateDisplay }}`);
    expect(spectator.element.innerHTML).toBe('Completed');
  });

  it('normalizes TaskState.Finished to Completed', () => {
    spectator = createPipe(`{{ '${TaskState.Finished}' | jobStateDisplay }}`);
    expect(spectator.element.innerHTML).toBe('Completed');
  });

  it('transforms JobState.Running correctly', () => {
    spectator = createPipe(`{{ '${JobState.Running}' | jobStateDisplay }}`);
    expect(spectator.element.innerHTML).toBe('Running');
  });

  it('transforms TaskState.Running correctly', () => {
    spectator = createPipe(`{{ '${TaskState.Running}' | jobStateDisplay }}`);
    expect(spectator.element.innerHTML).toBe('Running');
  });

  it('normalizes JobState.Failed to Failed', () => {
    spectator = createPipe(`{{ '${JobState.Failed}' | jobStateDisplay }}`);
    expect(spectator.element.innerHTML).toBe('Failed');
  });

  it('normalizes TaskState.Error to Failed', () => {
    spectator = createPipe(`{{ '${TaskState.Error}' | jobStateDisplay }}`);
    expect(spectator.element.innerHTML).toBe('Failed');
  });

  it('transforms TaskState.Pending correctly', () => {
    spectator = createPipe(`{{ '${TaskState.Pending}' | jobStateDisplay }}`);
    expect(spectator.element.innerHTML).toBe('Pending');
  });

  it('handles null', () => {
    spectator = createPipe('{{ null | jobStateDisplay }}');
    expect(spectator.element.innerHTML).toBe('');
  });
});
