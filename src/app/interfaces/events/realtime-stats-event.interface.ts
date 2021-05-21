import { ReportingRealtimeUpdate } from 'app/interfaces/reporting.interface';

export interface RealtimeStatsEvent {
  name: 'RealtimeStats';
  sender: unknown;
  data: ReportingRealtimeUpdate;
}
