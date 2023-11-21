export interface SmbShareConnection {
  service: string;
  server_id: {
    pid: string;
    task_id: string;
    vnn: string;
    unique_id: string;
  };
  tcon_id: string;
  session_id: string;
}

export interface SmbSession {
  session_id: string;
  server_id: {
    pid: string;
    task_id: string;
    vnn: string;
    unique_id: string;
  };
  uid: number;
  gid: number;
  username: string;
  groupname: string;
  remote_machine: string;
  hostname: string;
  session_dialect: string;
  encryption: {
    cipher: string;
    degree: string;
  };
  signing: {
    cipher: string;
    degree: string;
  };
  share_connections: SmbShareConnection[];
}
