import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum ReportZoomLevel {
  Hour = '60m',
  Day = '24h',
  Week = '7d',
  Month = '1M',
  HalfYear = '6M',
}

export const zoomLevelLabels = new Map<ReportZoomLevel, string>([
  [ReportZoomLevel.Hour, T('1 hour')],
  [ReportZoomLevel.Day, T('1 day')],
  [ReportZoomLevel.Week, T('1 week')],
  [ReportZoomLevel.Month, T('1 month')],
  [ReportZoomLevel.HalfYear, T('6 months')],
]);
