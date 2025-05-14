import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextNvmeOf = {
  baseNqnTooltip: T('NQN to be used as the prefix on the creation of a subsystem, if a subnqn is not supplied. Modifying this value will not change the subnqn of any existing subsystems.'),
  rdmaTooltip: T('Once enabled one or more ports may be configured with RDMA selected as the transport. \
Requires RDMA-capable system and network equipment.'),
  rdmaDisabledTooltip: T('Not enabled, because this system does not support RDMA.'),
  xportReferralTooltip: T('If ANA is active then referrals will always be generated between the peer ports on each TrueNAS controller node.'),

  dhchapKeyTooltip: T('DH-CHAP key to be used to authenticate the host.'),
  dhGroupTooltip: T('Use DH (Diffie-Hellman) key exchange on top of CHAP for additional security'),
  noDhText: T("Don't use DH key exchange."),
  generateHostKeyDisabled: T('Please enter Host NQN first.'),
  dhchapCtrlKey: T('If set, the secret that this TrueNAS will present to the host when the host is connecting (Bi-Directional Authentication).'),

  onlyStaticIpsShown: T('Only interfaces with static IPs are shown.'),
};
