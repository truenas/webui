import { CallParams } from '@truenas/api-client';
import { Required, Overwrite } from 'utility-types';
import { NvmeOfAddressFamily, NvmeOfNamespaceType, NvmeOfTransportType } from 'app/enums/nvme-of.enum';
import { WebUiApiDirectory, WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';

type D = WebUiApiDirectory;

export interface NvmeOfGlobalConfig {
  id: number;
  basenqn: string;
  kernel: boolean;
  ana: boolean;
  rdma: boolean;
  xport_referral: boolean;
}

export interface NvmeOfSubsystem {
  id: number;
  name: string;
  subnqn: string;
  serial: string;
  allow_any_host: boolean;
  pi_enable: boolean | null;
  qid_max: number | null;
  ieee_oui: string | null;
  ana: boolean | null;

  /**
   * List of ids. Only populated with extra.options.verbose
   */
  ports: number[] | null;

  /**
   * List of ids. Only populated with extra.options.verbose
   */
  hosts: number[] | null;

  /**
   * List of ids. Only populated with extra.options.verbose
   */
  namespaces: number[] | null;
}

export type UpdateNvmeOfSubsystem = Partial<Omit<NvmeOfSubsystem, 'id'>>;

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

export interface NvmeOfNamespace {
  id: number;
  nsid: number | null;
  subsys: NvmeOfSubsystem;
  device_type: NvmeOfNamespaceType;
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
> & { subsys_id?: number };
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
  description: string;
  dhchap_key: string | null;
  dhchap_ctrl_key: string | null;
  dhchap_dhgroup: string | null;
  dhchap_hash: string | null;
}

export type UpdateNvmeOfHost = Partial<Omit<NvmeOfHost, 'id'>>;

/** A DH-HMAC-CHAP hash, as `nvmet.host.dhchap_hash_choices` lists them. */
export type NvmeOfDhchapHash = NonNullable<CallParams<D, 'nvmet.host.generate_key'>[0]>;

export type NvmeOfSubsystemDetails = Overwrite<NvmeOfSubsystem, {
  hosts: NvmeOfHost[];
  ports: NvmeOfPort[];
  namespaces: NvmeOfNamespace[];
}>;

export enum PortOrHostDeleteType {
  Port = 'port',
  Host = 'host',
}

export interface PortOrHostDeleteDialogData {
  type: PortOrHostDeleteType;
  item: NvmeOfPort | NvmeOfHost;
  name: string;
  subsystemsInUse: NvmeOfSubsystemDetails[];
}

/**
 * Reads an `nvmet.subsys.*` row as the UI's subsystem. Middleware spells nothing differently, but leaves
 * the verbose-only id lists and the optional flags optional.
 */
export function toNvmeOfSubsystem(
  entry: WebUiQueryEntity<'nvmet.subsys.query'>,
): NvmeOfSubsystem {
  return entry as NvmeOfSubsystem;
}

/** Reads an `nvmet.namespace.query` row, whose `device_type` is the wire literal, as the UI's namespace. */
export function toNvmeOfNamespace(entry: WebUiQueryEntity<'nvmet.namespace.query'>): NvmeOfNamespace {
  return entry as NvmeOfNamespace;
}

/** Reads an `nvmet.host.*` row as the UI's host. */
export function toNvmeOfHost(
  entry: WebUiQueryEntity<'nvmet.host.query'>,
): NvmeOfHost {
  return entry as NvmeOfHost;
}

/** Reads an `nvmet.port.*` row, whose transport and address family are wire literals, as the UI's port. */
export function toNvmeOfPort(
  entry: WebUiQueryEntity<'nvmet.port.query'>,
): NvmeOfPort {
  return entry as NvmeOfPort;
}

/**
 * Hands the host form's payload to `nvmet.host.create` / `update` unchanged. The hash and DH group come from
 * choices calls and are held as strings; middleware narrows them to the values those calls return.
 */
export function toNvmeOfHostCreateArgs(payload: UpdateNvmeOfHost): CallParams<D, 'nvmet.host.create'>[0] {
  return payload as CallParams<D, 'nvmet.host.create'>[0];
}

/**
 * Hands the port form's payload to `nvmet.port.create` / `update` unchanged. Middleware declares one shape per
 * transport (no service id for Fibre Channel, a numeric one otherwise); the form edits all three as one.
 */
export function toNvmeOfPortCreateArgs(payload: UpdateNvmeOfPort): CallParams<D, 'nvmet.port.create'>[0] {
  return payload as CallParams<D, 'nvmet.port.create'>[0];
}
