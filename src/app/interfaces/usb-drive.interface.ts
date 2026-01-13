export interface UsbDrivePartition {
  name: string;
  size: number | null;
  fstype: string | null;
  label: string | null;
  mountpoint: string | null;
}

export interface UsbDrive {
  id: string;
  name: string;
  serial: string | null;
  vendor: string | null;
  model: string | null;
  size: number | null;
  mountpoint: string | null;
  fstype: string | null;
  label: string | null;
  bus: number | null;
  dev: number | null;
  partitions: UsbDrivePartition[] | null;
}
