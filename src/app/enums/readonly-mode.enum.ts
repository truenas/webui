import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum ReadOnlyMode {
  Set = 'SET',
  Require = 'REQUIRE',
  Ignore = 'IGNORE',
}

export const readonlyModeNames = new Map<ReadOnlyMode, string>([
  [ReadOnlyMode.Set, T('SET')],
  [ReadOnlyMode.Require, T('REQUIRE')],
  [ReadOnlyMode.Ignore, T('IGNORE')],
]);
