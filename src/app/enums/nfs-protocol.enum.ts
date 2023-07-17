export enum NfsProtocol {
  V3 = 'NFSV3',
  V4 = 'NFSV4',
}

export const nfsProtocolLabels = new Map<NfsProtocol, string>([
  [NfsProtocol.V3, 'NFSv3'],
  [NfsProtocol.V4, 'NFSv4'],
]);
