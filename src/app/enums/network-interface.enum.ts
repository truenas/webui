export enum NetworkInterfaceType {
  Bridge = 'BRIDGE',
  LinkAggregation = 'LINK_AGGREGATION',
  Physical = 'PHYSICAL',
  Vlan = 'VLAN',
  Unknown = 'UNKNOWN',
}

export enum CreateNetworkInterfaceType {
  Bridge = 'BRIDGE',
  LinkAggregation = 'LINK_AGGREGATION',
  Vlan = 'VLAN',
}

export enum NetworkInterfaceAliasType {
  Inet = 'INET',
  Inet6 = 'INET6',
}

export enum NetworkInterfaceFlag {
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
  Unknown = 'LINK_STATE_UNKNOWN',
}

export enum LacpduRate {
  Slow = 'SLOW',
  Fast = 'FAST',
}
