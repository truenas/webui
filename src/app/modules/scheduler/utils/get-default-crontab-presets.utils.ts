import { TranslateService } from '@ngx-translate/core';
import { format, parse } from 'date-fns';
import { CronPreset } from 'app/modules/scheduler/interfaces/cron-preset.interface';

export enum CronPresetValue {
  Hourly = '0 * * * *',
  Daily = '0 0 * * *',
  Weekly = '0 0 * * sun',
  Monthly = '0 0 1 * *',
}

export function getDefaultCrontabPresets(translate: TranslateService): CronPreset[] {
  const midnight24h = '00:00';
  const midnight12h = format(parse('00:00', 'HH:mm', new Date()), 'hh:mm aa');
  const midnightBoth = `${midnight24h} (${midnight12h})`;

  return [
    {
      label: translate.instant('Hourly'),
      value: CronPresetValue.Hourly,
      description: translate.instant('At the start of each hour'),
    },
    {
      label: translate.instant('Daily'),
      value: CronPresetValue.Daily,
      description: translate.instant('At {time}', { time: midnightBoth }),
    },
    {
      label: translate.instant('Weekly'),
      value: CronPresetValue.Weekly,
      description: translate.instant('On Sundays at {time}', { time: midnightBoth }),
    },
    {
      label: translate.instant('Monthly'),
      value: CronPresetValue.Monthly,
      description: translate.instant('On the first day of the month at {time}', { time: midnightBoth }),
    },
  ];
}
