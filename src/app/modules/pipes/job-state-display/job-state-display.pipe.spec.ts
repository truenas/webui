import { SpectatorPipe, createPipeFactory } from '@ngneat/spectator/jest';
import { JobState } from 'app/enums/job-state.enum';
import { JobStateDisplayPipe } from './job-state-display.pipe';

describe('JobStateDisplayPipe', () => {
  let spectator: SpectatorPipe<JobStateDisplayPipe>;
  const createPipe = createPipeFactory({
    pipe: JobStateDisplayPipe,
  });

  it('normalizes SUCCESS to Completed', () => {
    spectator = createPipe(`{{ '${JobState.Success}' | jobStateDisplay }}`);
    expect(spectator.element.innerHTML).toBe('Completed');
  });

  it('normalizes FINISHED to Completed', () => {
    spectator = createPipe(`{{ '${JobState.Finished}' | jobStateDisplay }}`);
    expect(spectator.element.innerHTML).toBe('Completed');
  });

  it('transforms RUNNING correctly', () => {
    spectator = createPipe(`{{ '${JobState.Running}' | jobStateDisplay }}`);
    expect(spectator.element.innerHTML).toBe('Running');
  });

  it('normalizes FAILED to Failed', () => {
    spectator = createPipe(`{{ '${JobState.Failed}' | jobStateDisplay }}`);
    expect(spectator.element.innerHTML).toBe('Failed');
  });

  it('normalizes ERROR to Failed', () => {
    spectator = createPipe(`{{ '${JobState.Error}' | jobStateDisplay }}`);
    expect(spectator.element.innerHTML).toBe('Failed');
  });

  it('handles null', () => {
    spectator = createPipe('{{ null | jobStateDisplay }}');
    expect(spectator.element.innerHTML).toBe('');
  });
});
