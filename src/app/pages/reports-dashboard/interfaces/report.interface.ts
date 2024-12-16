import { dygraphs } from 'dygraphs';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { ReportingGraph } from 'app/interfaces/reporting-graph.interface';
import { ReportZoomLevel } from 'app/pages/reports-dashboard/enums/report-zoom-level.enum';

export interface TimeData {
  /**
   * Seconds since epoch time
   */
  start: number;
  /**
   * Seconds since epoch time
   */
  end?: number;
  step?: string;
  legend?: string;
}

export interface TimeAxisData {
  timespan: ReportZoomLevel;
  timeformat: string;
  culling: number;
}

export interface Report extends ReportingGraph {
  isRendered?: boolean[];
  errorConf?: EmptyConfig;
}

export type LegendDataWithStackedTotalHtml = dygraphs.LegendData & {
  stackedTotalHTML: string;
  stackedTotal?: number;
  chartId: string;
};

export interface FetchReportParams {
  rrdOptions: TimeData;
  report: Report;
  identifier?: string;
}
