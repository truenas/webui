import { ContainerDevice, ContainerDeviceEntry } from 'app/interfaces/container.interface';

/**
 * Maps ContainerDeviceEntry to ContainerDevice with ID
 * The API wraps device data in 'attributes' and adds an 'id' field at the top level.
 * This function flattens the structure by adding id directly to the device attributes.
 */
export function containerDeviceEntryToDevice(
  containerDevice: ContainerDeviceEntry,
): ContainerDevice {
  return {
    ...containerDevice.attributes,
    id: containerDevice.id,
  };
}

/**
 * Maps array of ContainerDeviceEntries to ContainerDevices
 */
export function containerDeviceEntriesToDevices(
  containerDevices: ContainerDeviceEntry[],
): ContainerDevice[] {
  return containerDevices.map(containerDeviceEntryToDevice);
}
