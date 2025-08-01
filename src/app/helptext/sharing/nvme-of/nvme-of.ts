import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextNvmeOf = {
  baseNqnTooltip: T('NQN to be used as the prefix on the creation of a subsystem, if a subnqn is not supplied. Modifying this value will not change the subnqn of any existing subsystems.'),
  rdmaTooltip: T('Once enabled one or more ports may be configured with RDMA selected as the transport. \
Requires an Enterprise license, RDMA-capable system and network equipment.'),
  rdmaDisabledTooltip: T('Not enabled, because this system does not support RDMA.'),
  anaDisabledTooltip: T('Not enabled, because this feature requires an Enterprise license.'),

  dhchapKeyTooltip: T('DH-CHAP key to be used to authenticate the host.'),
  noDhText: T("Don't use DH key exchange."),
  generateHostKeyDisabled: T('Please enter Host NQN first.'),
  dhchapCtrlKey: T('If set, the secret that this TrueNAS will present to the host when the host is connecting (Bi-Directional Authentication).'),
  dhKeyExchangeTooltip: T('Diffie–Hellman key exchange is used in addition to CHAP for authentication.'),

  onlyStaticIpsShown: T('Only interfaces with static IPs are shown.'),

  noNamespacesWarning: T('This subsystem has no namespaces.'),
  noPortsWarning: T('No ports are associated with this subsystem. It will not be accessible.'),
  noHostsWarning: T('No hosts are allowed to access this subsystem. It will not be accessible.'),
  hasHostAuthentication: T('Host authentication is enabled'),

  addHost: T('Select hosts you want to be able to access the subsystem.'),
  addPort: T('Select ports this subsystem will be accessible on.'),

  subsystemNqn: T('The NVMe Qualified Name (NQN) is used to identify the subsystem. Leave blank to generate NQN using the base NQN from global settings.'),
};
