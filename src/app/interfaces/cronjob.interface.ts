import { Schedule } from 'app/interfaces/schedule.interface';

export interface Cronjob {
  command: string;
  description: string;
  enabled: boolean;
  id: number;
  schedule: Schedule;
  stderr: boolean;
  stdout: boolean;
  user: string;
}

export type CronjobUpdate = Omit<Cronjob, 'id'>;
