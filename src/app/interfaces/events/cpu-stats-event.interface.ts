import { AllCpusUpdate } from 'app/interfaces/reporting.interface';

export interface CpuStatsEvent {
  name: 'CpuStats';
  sender: unknown;
  data: AllCpusUpdate;
}
