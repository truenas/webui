export interface IscsiGlobalConfig {
  alua: boolean;
  basename: string;
  id: number;
  isns_servers: string[];
  pool_avail_threshold: number;
}
