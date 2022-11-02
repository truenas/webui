import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum NetcatMode {
  Local = 'LOCAL',
  Remote = 'REMOTE',
}

export const netcatModeNames = new Map<NetcatMode, string>([
  [NetcatMode.Local, T('LOCAL')],
  [NetcatMode.Remote, T('REMOTE')],
]);
