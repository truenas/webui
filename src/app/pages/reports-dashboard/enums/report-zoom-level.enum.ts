import { TranslateService } from '@ngx-translate/core';

export enum ReportZoomLevel {
  Hour = '60m',
  Day = '24h',
  Week = '7d',
  Month = '1M',
  HalfYear = '5M',
}

export function getZoomLevelLabels(translate: TranslateService): Map<ReportZoomLevel, string> {
  return new Map<ReportZoomLevel, string>([
    [ReportZoomLevel.Hour, translate.instant('1 hour')],
    [ReportZoomLevel.Day, translate.instant('1 day')],
    [ReportZoomLevel.Week, translate.instant('1 week')],
    [ReportZoomLevel.Month, translate.instant('1 month')],
    [ReportZoomLevel.HalfYear, translate.instant('6 months')],
  ]);
}
