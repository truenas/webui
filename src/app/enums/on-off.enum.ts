import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum OnOff {
  On = 'ON',
  Off = 'OFF',
}

export const onOffLabels = new Map<OnOff, string>([
  [OnOff.On, T('On')],
  [OnOff.Off, T('Off')],
]);
