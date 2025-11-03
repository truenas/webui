import { ContainerDeviceEntry, ContainerDeviceWithId } from 'app/interfaces/container.interface';

/**
 * Maps ContainerDeviceEntry to ContainerDevice with ID
 * The new API wraps device data in 'attributes' and adds an 'id' field
 */
export function containerDeviceToVirtualizationDevice(
  containerDevice: ContainerDeviceEntry,
): ContainerDeviceWithId {
  return {
    ...containerDevice.attributes,
    id: containerDevice.id,
  } as ContainerDeviceWithId;
}

/**
 * Maps array of ContainerDeviceEntries to ContainerDevices with IDs
 */
export function containerDevicesToVirtualizationDevices(
  containerDevices: ContainerDeviceEntry[],
): ContainerDeviceWithId[] {
  return containerDevices.map(containerDeviceToVirtualizationDevice);
}
