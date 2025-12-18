import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum WebSharePasskey {
  Required = 'REQUIRED',
  Enabled = 'ENABLED',
  Disabled = 'DISABLED',
}

export const webSharePasskeyLabels = new Map<WebSharePasskey, string>([
  [WebSharePasskey.Required, T('Required')],
  [WebSharePasskey.Enabled, T('Enabled')],
  [WebSharePasskey.Disabled, T('Disabled')],
]);
