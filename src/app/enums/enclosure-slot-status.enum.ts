export enum EnclosureSlotStatus {
  Clear = 'CLEAR',
  Fault = 'FAULT',
  Identify = 'IDENTIFY',
}

export enum EnclosureStatus {
  Ok = 'OK',
  Invop = 'INVOP',
  Info = 'INFO',
  NonCrit = 'NON-CRIT',
  Crit = 'CRIT',
  Unrecov = 'UNRECOV',
}

export enum EnclosureDiskStatus {
  Offline = 'OFFLINE',
  Removed = 'REMOVED',
  Faulted = 'FAULTED',
  Split = 'SPLIT',
  Unavail = 'UNAVAIL',
  Degraded = 'DEGRADED',
  Online = 'ONLINE',
  Unknown = 'UNKNOWN',
}

// TODO: Find out what all element name possibilities are to complete the enum
export enum EnclosureElementType {
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
