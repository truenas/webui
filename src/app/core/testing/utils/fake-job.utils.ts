import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';

export function fakeSuccessfulJob<T = void>(jobResult: T = undefined): Job<T> {
  return {
    abortable: false,
    description: '',
    error: '',
    exception: '',
    id: 0,
    result: jobResult,
    state: JobState.Success,
  } as Job<T>;
}
