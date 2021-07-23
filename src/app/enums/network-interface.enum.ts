export enum NetworkInterfaceType {
  Bridge = 'BRIDGE',
  LinkAggregation = 'LINK_AGGREGATION',
  Physical = 'PHYSICAL',
  Vlan = 'VLAN',
  Unknown = 'UNKNOWN',
}

export enum NetworkInterfaceAliasType {
  Inet = 'INET',
  Inet6 = 'INET6',
}

export enum NetworkInterfaceFlags {
  Multicast = 'MULTICAST',
  Up = 'UP',
  Broadcast = 'BROADCAST',
}

export enum LinkAggregationProtocol {
  Lacp = 'LACP',
  Failover = 'FAILOVER',
  LoadBalance = 'LOADBALANCE',
  RoundRobin = 'ROUNDROBIN',
  None = 'NONE',
}

export enum LinkState {
  Up = 'LINK_STATE_UP',
  Down = 'LINK_STATE_DOWN',
}
