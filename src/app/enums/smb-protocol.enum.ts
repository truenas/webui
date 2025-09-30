import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum SmbProtocol {
  Spotlight = 'SPOTLIGHT',
  Wsp = 'WSP',
}

export const smbProtocolLabels = new Map<SmbProtocol, string>([
  [SmbProtocol.Spotlight, T('Spotlight')],
  [SmbProtocol.Wsp, T('WSP')],
]);
