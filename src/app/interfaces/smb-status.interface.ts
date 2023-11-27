export type SmbStatus = SmbSession | SmbShareInfo;

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
