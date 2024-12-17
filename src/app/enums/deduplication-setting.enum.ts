import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum DeduplicationSetting {
  On = 'ON',
  Off = 'OFF',
  Verify = 'VERIFY',
}

export const deduplicationSettingLabels = new Map<DeduplicationSetting, string>([
  [DeduplicationSetting.On, T('On')],
  [DeduplicationSetting.Off, T('Off')],
  [DeduplicationSetting.Verify, T('Verify')],
]);

export enum NewDeduplicationQuotaSetting {
  Auto = 'AUTO',
  Custom = 'CUSTOM',
}
