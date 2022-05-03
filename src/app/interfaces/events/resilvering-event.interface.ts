import { ResilverData } from 'app/interfaces/resilver-job.interface';

export interface ResilveringEvent {
  name: string;
  sender: unknown;
  data: ResilverData;
}
