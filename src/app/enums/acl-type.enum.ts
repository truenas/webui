export enum AclType {
  Nfs4 = 'NFS4',
  Posix1e = 'POSIX1E',
  Off = 'OFF',
}

export enum AclMode {
  Restricted = 'RESTRICTED',
  Passthrough = 'PASSTHROUGH',
  Discard = 'DISCARD',
  Inherit = 'INHERIT',
}

export enum DefaultAclType {
  Nfs4Open = 'NFS4_OPEN',
  Nfs4Restricted = 'NFS4_RESTRICTED',
  Nfs4Home = 'NFS4_HOME',
  Nfs4DomainHome = 'NFS4_DOMAIN_HOME',
  PosixOpen = 'POSIX_OPEN',
  PosixHome = 'POSIX_HOME',
  PosixRestricted = 'POSIX_RESTRICTED',
  Open = 'OPEN',
  Restricted = 'RESTRICTED',
  Home = 'HOME',
}
