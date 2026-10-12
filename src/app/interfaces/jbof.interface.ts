import { WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';

export interface Jbof extends JbofUpdate {
  id: number;
}

export interface JbofUpdate {
  description: string;
  mgmt_ip1: string;
  mgmt_ip2: string;
  mgmt_username: string;
  mgmt_password: string;
}

/** Reads a `jbof.query` row. Middleware leaves the defaulted `description` and `mgmt_ip2` optional. */
export function toJbof(jbof: WebUiQueryEntity<'jbof.query'>): Jbof {
  return jbof as Jbof;
}
