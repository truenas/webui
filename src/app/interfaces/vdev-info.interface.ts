import { UUID } from 'angular2-uuid';
import { ManagerDisk } from 'app/pages/storage/components/manager/manager-disk.interface';

export class VdevInfo {
  disks: ManagerDisk[];
  type: string;
  uuid: string;
  group: string;
  showDiskSizeError: boolean;
  rawSize: number;
  vdevDisksError: boolean;

  constructor(type: string, group: string) {
    this.disks = [];
    this.uuid = UUID.UUID();
    this.group = group;
    this.type = type;
    this.showDiskSizeError = false;
    this.vdevDisksError = false;
    this.rawSize = 0;
  }
}
