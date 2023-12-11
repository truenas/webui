export type SmbStatus = SmbSession | SmbLockInfo | SmbShareInfo | SmbNotificationInfo;

interface SmbServerId {
  pid: string;
  task_id: string;
  vnn: string;
  unique_id: string;
}

interface SmbEncryption {
  cipher: string;
  degree: string;
}

export interface SmbShareConnection {
  service: string;
  server_id: SmbServerId;
  tcon_id: string;
  session_id: string;
}

export interface SmbSession {
  session_id: string;
  server_id: SmbServerId;
  uid: number;
  gid: number;
  username: string;
  groupname: string;
  remote_machine: string;
  hostname: string;
  session_dialect: string;
  encryption: SmbEncryption;
  signing: SmbEncryption;
  share_connections: SmbShareConnection[];
}

export interface SmbLockInfo {
  service_path: string;
  filename: string;
  fileid: {
    devid: number;
    inode: number;
    extid: number;
  };
  num_pending_deletes: number;
  opens: Record<string, SmbOpenInfo>;
}

export interface SmbOpenInfo {
  server_id: SmbServerId;
  uid: number;
  username: string;
  share_file_id: string;
  sharemode: {
    hex: string;
    READ: boolean;
    WRITE: boolean;
    DELETE: boolean;
    text: string;
  };
  access_mask: {
    hex: string;
    READ_DATA: boolean;
    WRITE_DATA: boolean;
    APPEND_DATA: boolean;
    READ_EA: boolean;
    WRITE_EA: boolean;
    EXECUTE: boolean;
    READ_ATTRIBUTES: boolean;
    WRITE_ATTRIBUTES: boolean;
    DELETE_CHILD: boolean;
    DELETE: boolean;
    READ_CONTROL: boolean;
    WRITE_DAC: boolean;
    SYNCHRONIZE: boolean;
    ACCESS_SYSTEM_SECURITY: boolean;
    text: string;
  };
  caching: {
    READ: boolean;
    WRITE: boolean;
    HANDLE: boolean;
    hex: string;
    text: string;
  };
  oplock: Record<string, unknown>;
  lease: Record<string, unknown>;
  opened_at: string;
}

export interface SmbShareInfo {
  service: string;
  server_id: SmbServerId;
  tcon_id: string;
  session_id: string;
  machine: string;
  connected_at: string;
  encryption: SmbEncryption;
  signing: SmbEncryption;
}

export interface SmbNotificationInfo {
  server_id: SmbServerId;
  path: string;
  filter: string;
  subdir_filter: string;
  creation_time: string;
}
