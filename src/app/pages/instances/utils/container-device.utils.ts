import { ContainerDeviceEntry, VirtualizationDevice } from 'app/interfaces/virtualization.interface';

/**
 * Maps ContainerDeviceEntry to VirtualizationDevice with ID
 * The new API wraps device data in 'attributes' and adds an 'id' field
 */
export function containerDeviceToVirtualizationDevice(
  containerDevice: ContainerDeviceEntry,
): VirtualizationDevice & { id: number } {
  return {
    ...containerDevice.attributes,
    id: containerDevice.id,
  } as VirtualizationDevice & { id: number };
}

/**
 * Maps array of ContainerDeviceEntries to VirtualizationDevices with IDs
 */
export function containerDevicesToVirtualizationDevices(
  containerDevices: ContainerDeviceEntry[],
): (VirtualizationDevice & { id: number })[] {
  return containerDevices.map(containerDeviceToVirtualizationDevice);
}
