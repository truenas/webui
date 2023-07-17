import { dygraphs } from 'dygraphs';
import { ReportingData } from 'app/interfaces/reporting.interface';
import { Report } from 'app/pages/reports-dashboard/interfaces/report.interface';

export interface ReportDataRequestEvent {
  name: 'ReportDataRequest';
  sender: unknown;
  data: {
    report: Report;
    params: { name: string; identifier: string };
    timeFrame: { start: number; end: number };
    truncate: boolean;
  };
}

export interface LegendEvent {
  name: 'LegendData*';
  sender: unknown;
  data: dygraphs.LegendData;
}

export interface ReportDataEvent {
  name: 'ReportData*';
  sender: unknown;
  data: ReportingData;
}
