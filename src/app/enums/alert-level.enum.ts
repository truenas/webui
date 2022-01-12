import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum AlertLevel {
  Info = 'INFO',
  Notice = 'NOTICE',
  Warning = 'WARNING',
  Error = 'ERROR',
  Critical = 'CRITICAL',
  Alert = 'ALERT',
  Emergency = 'EMERGENCY',
}

export const alertLevelLabels = new Map<AlertLevel, string>([
  [AlertLevel.Info, T('Info')],
  [AlertLevel.Notice, T('Notice')],
  [AlertLevel.Warning, T('Warning')],
  [AlertLevel.Error, T('Error')],
  [AlertLevel.Critical, T('Critical')],
  [AlertLevel.Alert, T('Alert')],
  [AlertLevel.Emergency, T('Emergency')],
]);
