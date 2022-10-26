import { UUID } from 'angular2-uuid';
import { ManagerDisk } from 'app/pages/storage/components/manager/manager-disk.interface';
import { ManagerVdevs } from 'app/pages/storage/components/manager/manager.component';

export class ManagerVdev {
  disks: ManagerDisk[];
  type: string;
  uuid: string;
  group: keyof ManagerVdevs;
  showDiskSizeError: boolean;
  rawSize: number;
  vdevDisksError: boolean;

  constructor(type: string, group: keyof ManagerVdevs) {
    this.disks = [];
    this.uuid = UUID.UUID();
    this.group = group;
    this.type = type;
    this.showDiskSizeError = false;
    this.vdevDisksError = false;
    this.rawSize = 0;
  }
}
