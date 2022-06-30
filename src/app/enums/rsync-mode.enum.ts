export enum RsyncMode {
  Module = 'MODULE',
  Ssh = 'SSH',
}

export enum RsyncModuleMode {
  ReadOnly = 'RO',
  WriteOnly = 'WO',
  ReadAndWrite = 'RW',
}

export enum RsyncSshConnectMode {
  PrivateKey,
  KeyChain,
}
