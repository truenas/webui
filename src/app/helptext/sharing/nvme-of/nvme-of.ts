import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextNvmeOf = {
  baseNqnTooltip: T('NQN to be used as the prefix on the creation of a subsystem, if a subnqn is not supplied. Modifying this value will not change the subnqn of any existing subsystems.'),
  rdmaTooltip: T('Once enabled one or more ports may be configured with RDMA selected as the transport. \
Requires RDMA-capable system and network equipment.'),
  rdmaDisabledTooltip: T('Not enabled, because this system does not support RDMA.'),
  xportReferralTooltip: T('If ANA is active then referrals will always be generated between the peer ports on each TrueNAS controller node.'),

  dhchapKeyTooltip: T('DH-CHAP key to be used to authenticate the host.'),

  onlyStaticIpsShown: T('Only interfaces with static IPs are shown.'),

  noPortsWarning: T('No ports are associated with this subsystem. It will not be accessible.'),
  noHostsWarning: T('No hosts are allowed to access this subsystem. It will not be accessible.'),
  hasHostAuthentication: T('Host authentication is enabled'),
};
