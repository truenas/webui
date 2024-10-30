export enum ServiceName {
  Afp = 'afp',
  Ftp = 'ftp',
  Gluster = 'glusterd',
  Iscsi = 'iscsitarget',
  Nfs = 'nfs',
  Smart = 'smartd',
  Snmp = 'snmp',
  Ssh = 'ssh',
  Cifs = 'cifs',
  Ups = 'ups',
  Http = 'http',
}

export const serviceNames = new Map<ServiceName, string>([
  [ServiceName.Afp, 'AFP'],
  [ServiceName.Ftp, 'FTP'],
  [ServiceName.Gluster, 'Gluster'],
  [ServiceName.Iscsi, 'iSCSI'],
  [ServiceName.Nfs, 'NFS'],
  [ServiceName.Smart, 'S.M.A.R.T.'],
  [ServiceName.Snmp, 'SNMP'],
  [ServiceName.Ssh, 'SSH'],
  [ServiceName.Cifs, 'SMB'],
  [ServiceName.Ups, 'UPS'],
]);

export enum RdmaProtocolName {
  Nfs = 'NFS',
}
