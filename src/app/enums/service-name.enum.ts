export enum ServiceName {
  Ftp = 'ftp',
  Iscsi = 'iscsitarget',
  Nfs = 'nfs',
  Snmp = 'snmp',
  Ssh = 'ssh',
  Cifs = 'cifs',
  Ups = 'ups',
  Http = 'http',
  NvmeOf = 'nvmet',
}

export const serviceNames = new Map<ServiceName, string>([
  [ServiceName.Ftp, 'FTP'],
  [ServiceName.Iscsi, 'iSCSI'],
  [ServiceName.Nfs, 'NFS'],
  [ServiceName.Snmp, 'SNMP'],
  [ServiceName.Ssh, 'SSH'],
  [ServiceName.Cifs, 'SMB'],
  [ServiceName.Ups, 'UPS'],
  [ServiceName.NvmeOf, 'NVMe-oF'],
]);

export enum RdmaProtocolName {
  Nfs = 'NFS',
  Iser = 'ISER',
  Nvmet = 'NVMET',
}

export enum ServiceOperation {
  Start = 'START',
  Stop = 'STOP',
  Restart = 'RESTART',
  Reload = 'RELOAD',
}
