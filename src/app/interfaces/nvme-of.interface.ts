import { Required } from 'utility-types';
import { NvmeOfAddressFamily, NvmeOfNamespaceDeviceType, NvmeOfTransportType } from 'app/enums/nvme-of.enum';

export interface NvmeOfGlobalConfig {
  id: number;
  basenqn: string;
  kernel: boolean;
  ana: boolean;
  rdma: boolean;
  xport_referral: boolean;
}

export type NvmeOfGlobalConfigUpdate = Partial<Omit<NvmeOfGlobalConfig, 'id'>>;

export interface NvmeOfSubsystem {
  id: number;
  name: string;
  subnqn: string;
  serial: string;
  allow_any_host: boolean;
  pi_enable: boolean | null;
  qix_max: number | null;
  ieee_oui: string | null;
  ana: boolean | null;
}

export type UpdateNvmeOfSubsystem = Partial<Omit<NvmeOfSubsystem, 'id'>>;
export type CreateNvmeOfSubsystem = Required<UpdateNvmeOfSubsystem, 'name'>;

export interface NvmeOfPort {
  id: number;
  index: number;
  addr_trtype: NvmeOfTransportType;
  addr_trsvcid: number | string;
  addr_traddr: string;
  addr_adrfam: NvmeOfAddressFamily;
  inline_data_size: number | null;
  max_queue_size: number | null;
  pi_enable: boolean | null;
  enabled: boolean;
}

export type UpdateNvmeOfPort = Partial<Omit<NvmeOfPort, 'id'>>;

export type CreateNvmeOfPort = Required<
  UpdateNvmeOfPort,
  'addr_trtype' | 'addr_trsvcid' | 'addr_traddr'
>;

export type NvmeOfTransportParams = [
  transportType: NvmeOfTransportType,
  force_ana?: boolean,
];

export interface NvmeOfNamespace {
  id: number;
  nsid: number | null;
  subsystem: NvmeOfSubsystem;
  device_type: NvmeOfNamespaceDeviceType;
  device_path: string;
  filesize: number | null;
  device_uuid: string;
  device_nguid: string;
  enabled: boolean;
  locked: boolean | null;
}

export type UpdateNvmeOfNamespace = Pick<
  Partial<NvmeOfNamespace>,
  'nsid' | 'device_type' | 'device_path' | 'filesize' | 'enabled'
> & { subsys_id: number };
export type CreateNvmeOfNamespace = Required<UpdateNvmeOfNamespace, 'device_type' | 'device_path' | 'subsys_id'>;

export type DeleteNamespaceParams = [
  id: number,
  options?: {
    /**
     * Remove file underlying namespace if device_type is FILE.
     */
    remove?: boolean;
  },
];

export interface NvmeOfHost {
  id: number;
  hostnqn: string;
  dhchap: string | null;
  dhchap_ctrl_key: string | null;
  dhchap_dhgroup: string | null;
  dhchap_hash: string | null;
}

export type UpdateNvmeOfHost = Partial<Omit<NvmeOfHost, 'id'>>;
export type CreateNvmeOfHost = Required<UpdateNvmeOfHost, 'hostnqn'>;

export interface SubsystemPortAssociation {
  id: number;
  port: NvmeOfPort;
  subsystem: NvmeOfSubsystem;
}

export interface AssociateSubsystemPort {
  port_id: number;
  subsys_id: number;
}

export interface SubsystemHostAssociation {
  id: number;
  host: NvmeOfHost;
  subsystem: NvmeOfSubsystem;
}

export interface AssociateSubsystemHost {
  host_id: number;
  subsys_id: number;
}
