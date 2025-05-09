import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextNvmeOf = {
  baseNqnTooltip: T('NQN to be used as the prefix on the creation of a subsystem, if a subnqn is not supplied. Modifying this value will not change the subnqn of any existing subsystems.'),
  rdmaTooltip: T('Once enabled one or more ports may be configured with RDMA selected as the transport.\
Requires RDMA-capable system and network equipment.'),
  xportReferralTooltip: T('If ANA is active then referrals will always be generated between the peer ports on each TrueNAS controller node.'),

  onlyStaticIpsShown: T('Only interfaces with static IPs are shown.'),
};
