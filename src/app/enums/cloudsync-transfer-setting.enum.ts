import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum CloudsyncTransferSetting {
  Default = 'DEFAULT',
  Performance = 'PERFORMANCE',
  FastStorage = 'FAST_STORAGE',
}

export const cloudsyncTransferSettingLabels = new Map<CloudsyncTransferSetting, string>([
  [CloudsyncTransferSetting.Default, T('Default')],
  [CloudsyncTransferSetting.Performance, T('Performance')],
  [CloudsyncTransferSetting.FastStorage, T('Fast Storage')],
]);
