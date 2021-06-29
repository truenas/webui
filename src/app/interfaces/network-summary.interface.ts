export interface NetworkSummary {
  default_routes: string[];
  ips: {
    [nic: string]: {
      IPV4?: string[];
      IPV6?: string[];
    };
  };
  nameservers: string[];
}
