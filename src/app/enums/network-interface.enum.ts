import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

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
  Link = 'LINK',
}

export enum NetworkInterfaceFlag {
  Multicast = 'MULTICAST',
  Up = 'UP',
  Broadcast = 'BROADCAST',
  Running = 'RUNNING',
  LowerUp = 'LOWER_UP',
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

export const linkStateLabelMap = new Map<LinkState, string>([
  [LinkState.Up, T('LINK STATE UP')],
  [LinkState.Down, T('LINK STATE DOWN')],
  [LinkState.Unknown, T('LINK STATE UNKNOWN')],
]);

export enum LacpduRate {
  Slow = 'SLOW',
  Fast = 'FAST',
}
