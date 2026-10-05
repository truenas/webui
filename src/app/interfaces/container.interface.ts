import { FormControl, FormGroup } from '@angular/forms';
import { CallParams, CallResponse, JobParams } from '@truenas/api-client';
import {
  AllowedImageOs,
  ContainerCapabilitiesPolicy,
  ContainerDeviceType,
  ContainerGpuType,
  ContainerIdmapType,
  ContainerNicDeviceType,
  ContainerStatus,
  ContainerType,
} from 'app/enums/container.enum';
import { WebUiApiDirectory, WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';

export type ContainerMetrics = Record<string, ContainerStats>;

export interface ContainerStats {
  cpu: {
    cpu_user_percentage: number;
  };
  mem_usage: {
    mem_usage_ram_mib: number;
  };
  io_full_pressure: {
    io_full_pressure_full_60_percentage: number;
  };
}

export interface ContainerIdmap {
  type: ContainerIdmapType;
  slice?: number | null;
}

export interface Container {
  id: number;
  uuid: string;
  name: string;
  description: string;
  cpuset: string | null;
  autostart: boolean;
  time: string;
  shutdown_timeout: number;
  dataset: string;
  init: string;
  initdir: string | null;
  initenv: Record<string, unknown>;
  inituser: string | null;
  initgroup: string | null;
  idmap: ContainerIdmap | null;
  capabilities_policy: ContainerCapabilitiesPolicy;
  capabilities_state: Record<string, unknown>;
  default_network: string | null;
  status: {
    state: ContainerStatus;
    pid: number | null;
    domain_state: string | null;
  };
}

/** What the container form sends to `container.create`. */
export type CreateContainer = JobParams<WebUiApiDirectory, 'container.create'>[0];

/** What the container form sends to `container.update`. */
export type UpdateContainer = CallParams<WebUiApiDirectory, 'container.update'>[1];

export interface ContainerFilesystemDevice {
  id?: number;
  dtype: ContainerDeviceType.Filesystem;
  target: string;
  source: string;
}

export interface ContainerNicDevice {
  id?: number;
  dtype: ContainerDeviceType.Nic;
  trust_guest_rx_filters?: boolean; // Only applicable for VIRTIO NICs
  type: ContainerNicDeviceType;
  nic_attach: string | null;
  mac: string | null;
}

export interface ContainerUsbDevice {
  id?: number;
  dtype: ContainerDeviceType.Usb;
  usb: {
    vendor_id: string;
    product_id: string;
  } | null;
  device: string | null;
}

export interface ContainerGpuDevice {
  id?: number;
  dtype: ContainerDeviceType.Gpu;
  gpu_type: ContainerGpuType;
  pci_address: string;
}

export type ContainerDevice
  = | ContainerFilesystemDevice
    | ContainerUsbDevice
    | ContainerNicDevice
    | ContainerGpuDevice;

export interface ContainerImage {
  archs: string[];
  description: string;
  label: string;
  os: AllowedImageOs;
  release: string;
  variant: string;
  instance_types: ContainerType[];
  secureboot: boolean | null;
}

export interface ContainerStopParams {
  force?: boolean;
  force_after_timeout?: boolean;
}

export interface ContainerDeleteOptions {
  /**
   * Stops the container first when it is not already stopped.
   * Without it, deleting a running or suspended container is refused up front.
   */
  force?: boolean;

  /**
   * Destroys the container dataset together with its child datasets, snapshots,
   * clones of those snapshots and any holds on them. Not recoverable.
   * Without it, deleting a container whose dataset has children or snapshots is refused.
   */
  recursive?: boolean;
}

export type ContainerGlobalConfig = CallResponse<WebUiApiDirectory, 'lxc.config'>;

export type ContainerImageRegistryResponse = CallResponse<WebUiApiDirectory, 'container.image.query_registry'>[number];

export interface UsbCapability {
  product: string;
  product_id: string;
  vendor: string;
  vendor_id: string;
  bus: string;
  device: string;
}

export interface AvailableUsb {
  capability: UsbCapability;
  available: boolean;
  error: string | null;
  description: string;
}

export type ContainerEnvVariablesFormGroup = FormGroup<{
  name: FormControl<string>;
  value: FormControl<string>;
}>;

export interface ContainerDeviceEntry {
  id: number;
  attributes: ContainerDevice;
  container: number;
}

/**
 * Reads a `container.query` row into the shape the container pages are written against. The
 * generated entry spells `status.state`, `capabilities_policy` and `idmap.type` as the wire
 * literals where the pages compare them with the UI's enums, and leaves the fields middleware
 * defaults optional; it describes the same object.
 *
 * The `as` checks only that the two types are comparable, not that every field the UI reads is
 * present: a regenerated entry that drops or renames a field still compiles, and reads `undefined`.
 */
export function toContainer(container: WebUiQueryEntity<'container.query'>): Container {
  return container as Container;
}

/**
 * Reads a `container.device.query` row into the UI's device union, whose `dtype` and NIC `type`
 * are the UI's enums where the generated entry has the wire literals.
 *
 * The `as` checks only that the two types are comparable, not that every field the UI reads is
 * present: a regenerated entry that drops or renames a field still compiles, and reads `undefined`.
 */
export function toContainerDeviceEntry(device: WebUiQueryEntity<'container.device.query'>): ContainerDeviceEntry {
  return device as ContainerDeviceEntry;
}
