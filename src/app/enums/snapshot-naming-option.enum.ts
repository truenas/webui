import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum SnapshotNamingOption {
  NamingSchema = 'NAMING_SCHEMA',
  NameRegex = 'NAME_REGEX',
}

export const snapshotNamingOptionNames = new Map<SnapshotNamingOption, string>([
  [SnapshotNamingOption.NamingSchema, T('Matching naming schema')],
  [SnapshotNamingOption.NameRegex, T('Matching regular expression')],
]);
