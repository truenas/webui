import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum NvmeOfTransportType {
  Tcp = 'TCP',
  Rdma = 'RDMA',
  FibreChannel = 'FC',
}

export const nvmeOfTransportTypeLabels = new Map<NvmeOfTransportType, string>([
  [NvmeOfTransportType.Tcp, 'TCP'],
  [NvmeOfTransportType.Rdma, 'RDMA'],
  [NvmeOfTransportType.FibreChannel, 'Fibre Channel'],
]);

export enum NvmeOfAddressFamily {
  Ipv4 = 'IPV4',
  Ipv6 = 'IPV6',
  FibreChannel = 'FC',
}

export enum NvmeOfNamespaceType {
  Zvol = 'ZVOL',
  File = 'FILE',
}

export const nvmeOfNamespaceTypeLabels = new Map<NvmeOfNamespaceType, string>([
  [NvmeOfNamespaceType.Zvol, 'Zvol'],
  [NvmeOfNamespaceType.File, T('File')],
]);
