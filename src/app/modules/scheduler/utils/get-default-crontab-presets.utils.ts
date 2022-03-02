import { TranslateService } from '@ngx-translate/core';
import { CronPreset } from 'app/modules/scheduler/interfaces/cron-preset.interface';

export function getDefaultCrontabPresets(translate: TranslateService): CronPreset[] {
  return [
    {
      label: translate.instant('Hourly'),
      value: '0 * * * *',
      description: translate.instant('At the start of each hour'),
    },
    {
      label: translate.instant('Daily'),
      value: '0 0 * * *',
      description: translate.instant('At 00:00 (12:00 AM)'),
    },
    {
      label: translate.instant('Weekly'),
      value: '0 0 * * 0',
      description: translate.instant('On Sundays at 00:00 (12:00 AM)'),
    },
    {
      label: translate.instant('Monthly'),
      value: '0 0 1 * *',
      description: translate.instant('On the first day of the month at 00:00 (12:00 AM)'),
    },
  ];
}
