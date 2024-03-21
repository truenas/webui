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
