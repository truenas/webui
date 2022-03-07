export enum SmartTestType {
  Short = 'SHORT',
  Long = 'LONG',
  Conveyance = 'CONVEYANCE',
  Offline = 'OFFLINE',
}

export const smartTestTypeLabels = new Map<SmartTestType, string>([
  [SmartTestType.Short, 'SHORT'],
  [SmartTestType.Long, 'LONG'],
  [SmartTestType.Conveyance, 'CONVEYANCE'],
  [SmartTestType.Offline, 'OFFLINE'],
]);
