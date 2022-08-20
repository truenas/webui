import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum LoggingLevel {
  Default = 'DEFAULT',
  Debug = 'DEBUG',
  Info = 'INFO',
  Warning = 'WARNING',
  Error = 'ERROR',
}

export const loggingLevelNames = new Map<LoggingLevel, string>([
  [LoggingLevel.Default, T('DEFAULT')],
  [LoggingLevel.Debug, T('DEBUG')],
  [LoggingLevel.Info, T('INFO')],
  [LoggingLevel.Warning, T('WARNING')],
  [LoggingLevel.Error, T('ERROR')],
]);
