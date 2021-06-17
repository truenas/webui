export interface DynamicDnsUpdate {
  provider: string;
  checkip_ssl: boolean;
  checkip_server: string;
  checkip_path: string;
  ssl: boolean;
  custom_ddns_server: string;
  custom_ddns_path: string;
  domain: string[];
  username: string;
  password: string;
  period: number;
}
