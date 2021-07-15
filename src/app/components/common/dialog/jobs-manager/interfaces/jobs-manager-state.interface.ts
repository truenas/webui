import { Job } from 'app/interfaces/job.interface';

export interface JobsManagerState {
  isLoading: boolean;
  jobs: Job[];
}
