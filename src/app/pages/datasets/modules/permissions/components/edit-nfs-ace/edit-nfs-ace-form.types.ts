export enum NfsFormPermsType {
  Basic = 'BASIC',
  Advanced = 'ADVANCED',
}

export const nfsFormPermsTypeLabels = new Map<NfsFormPermsType, string>([
  [NfsFormPermsType.Basic, 'Basic'],
  [NfsFormPermsType.Advanced, 'Advanced'],
]);

export enum NfsFormFlagsType {
  Basic = 'BASIC',
  Advanced = 'ADVANCED',
}

export const nfsFormFlagsTypeLabels = new Map<NfsFormFlagsType, string>([
  [NfsFormFlagsType.Basic, 'Basic'],
  [NfsFormFlagsType.Advanced, 'Advanced'],
]);
