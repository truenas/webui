export interface NetworkSummary {
  default_routes: string[];
  ips: Record<string, {
    IPV4?: string[];
    IPV6?: string[];
  }>;
  nameservers: string[];
}
