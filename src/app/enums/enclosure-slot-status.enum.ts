import { TopologyItemStatus } from './vdev-status.enum';

export enum EnclosureSlotStatus {
  Clear = 'CLEAR',
  Fault = 'FAULT',
  Identify = 'IDENTIFY',
}

export enum EnclosureSlotDiskStatus {
  Available = 'AVAILABLE',
  Fault = 'FAULT',
}

// TODO: Find out what all element name possibilities are to complete the enum
export enum EnclosureElementName {
  ArrayDeviceSlot = 'Array Device Slot',
  Enclosure = 'Enclosure',
  PowerSupply = 'Power Supply',
  Cooling = 'Cooling',
  TemperatureSensors = 'Temperature Sensors',
  EnclosureServicesControllerElectronics = 'Enclosure Services Controller Electronics',
  SasExpander = 'SAS Expander',
  SasConnector = 'SAS Connector',
  VoltageSensor = 'Voltage Sensor',
  CurrentSensor = 'Current Sensor',
  DoorLock = 'Door Lock',
}

export type EnclosureSlotTopologyStatus = TopologyItemStatus | EnclosureSlotDiskStatus;
