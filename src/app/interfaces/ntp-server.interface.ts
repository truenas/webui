import { WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';

export interface NtpServer {
  address: string;
  burst: boolean;
  iburst: boolean;
  id: number;
  maxpoll: number;
  minpoll: number;
  prefer: boolean;
}

export interface CreateNtpServer {
  address: string;
  burst?: boolean;
  force?: boolean;
  iburst?: boolean;
  maxpoll: number;
  minpoll: number;
  prefer?: boolean;
}

/** Reads a `system.ntpserver.query` row. Middleware leaves the defaulted polling flags and intervals optional. */
export function toNtpServer(server: WebUiQueryEntity<'system.ntpserver.query'>): NtpServer {
  return server as NtpServer;
}
