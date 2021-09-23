import { ResilverData } from '../resilver-job.interface';

export interface ResilveringEvent {
  name: string;
  sender: unknown;
  data: ResilverData;
}
