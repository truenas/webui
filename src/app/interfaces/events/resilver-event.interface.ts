import { ResilverData } from '../resilver-job.interface';

export interface ResilverEvent {
  name: string;
  sender: unknown;
  data: ResilverData;
}
