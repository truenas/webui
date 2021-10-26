import { ReportingGraph } from 'app/interfaces/reporting-graph.interface';

export interface ReportingGraphsEvent {
  name: 'ReportingGraphs';
  sender: unknown;
  data: ReportingGraph[];
}
