import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';

export function fakeSuccessfulJob<T = void, A = unknown[]>(
  jobResult: T = undefined,
  jobArguments: A = undefined,
): Job<T, A> {
  return {
    arguments: jobArguments || [],
    abortable: false,
    description: '',
    error: '',
    exception: '',
    id: 0,
    result: jobResult,
    time_finished: { $date: 12345678900 },
    state: JobState.Success,
  } as Job<T, A>;
}
