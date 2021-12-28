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

export enum XmitHashPolicy {
  Layer2 = 'LAYER2',
  Layer2Plus3 = 'LAYER2+3',
  Layer3Plus4 = 'LAYER3+4',
}

export enum LinkState {
  Up = 'LINK_STATE_UP',
  Down = 'LINK_STATE_DOWN',
}

export enum LacpduRate {
  Slow = 'SLOW',
  Fast = 'FAST',
}
