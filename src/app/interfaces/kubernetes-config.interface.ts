export interface KubernetesConfig {
  cluster_cidr: string;
  cluster_dns_ip: string;
  configure_gpus: boolean;
  dataset: string;
  id: number;
  node_ip: string;
  pool: string;
  route_v4_gateway: string;
  route_v4_interface: string;
  route_v6_gateway: string;
  route_v6_interface: string;
  service_cidr: string;
  servicelb: boolean;
}

export interface KubernetesConfigUpdate {
  cluster_cidr: string;
  cluster_dns_ip: string;
  node_ip: string;
  pool: string;
  route_v4_gateway: string;
  route_v4_interface: string;
  service_cidr: string;
  migrate_applications?: boolean;
  configure_gpus?: boolean;
  force?: boolean;
}
