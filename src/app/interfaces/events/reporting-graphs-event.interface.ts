import { ReportingData } from 'app/interfaces/reporting.interface';

export interface ReportingGraphsEvent {
  name: 'ReportingGraphs';
  sender: unknown;
  data: ReportingData[];
}
