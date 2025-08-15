import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum YesNo {
  Yes = 'yes',
  No = 'no',
}

export const yesNoLabels = new Map<YesNo, string>([
  [YesNo.Yes, T('Yes')],
  [YesNo.No, T('No')],
]);
