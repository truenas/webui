import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { JobState } from 'app/enums/job-state.enum';
import { TaskState } from 'app/enums/task-state.enum';
import { JobStateDisplayPipe } from './job-state-display.pipe';

describe('JobStateDisplayPipe', () => {
  let pipe: JobStateDisplayPipe;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        JobStateDisplayPipe,
        {
          provide: TranslateService,
          useValue: {
            instant: (key: string) => key,
          },
        },
      ],
    });
    pipe = TestBed.inject(JobStateDisplayPipe);
  });

  it('normalizes JobState.Success to Completed', () => {
    expect(pipe.transform(JobState.Success)).toBe('Completed');
  });

  it('normalizes TaskState.Finished to Completed', () => {
    expect(pipe.transform(TaskState.Finished)).toBe('Completed');
  });

  it('transforms JobState.Running correctly', () => {
    expect(pipe.transform(JobState.Running)).toBe('Running');
  });

  it('transforms TaskState.Running correctly', () => {
    expect(pipe.transform(TaskState.Running)).toBe('Running');
  });

  it('normalizes JobState.Failed to Failed', () => {
    expect(pipe.transform(JobState.Failed)).toBe('Failed');
  });

  it('normalizes TaskState.Error to Failed', () => {
    expect(pipe.transform(TaskState.Error)).toBe('Failed');
  });

  it('transforms TaskState.Pending correctly', () => {
    expect(pipe.transform(TaskState.Pending)).toBe('Pending');
  });

  it('transforms JobState.Waiting correctly', () => {
    expect(pipe.transform(JobState.Waiting)).toBe('Waiting');
  });

  it('transforms JobState.Aborted correctly', () => {
    expect(pipe.transform(JobState.Aborted)).toBe('Aborted');
  });

  it('transforms TaskState.Hold correctly', () => {
    expect(pipe.transform(TaskState.Hold)).toBe('Hold');
  });

  it('transforms TaskState.Locked correctly', () => {
    expect(pipe.transform(TaskState.Locked)).toBe('Locked');
  });

  it('handles null', () => {
    expect(pipe.transform(null)).toBe('');
  });

  it('handles undefined', () => {
    expect(pipe.transform(undefined)).toBe('');
  });
});
