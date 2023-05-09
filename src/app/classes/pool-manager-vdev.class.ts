import { ManagerVdev } from 'app/classes/manager-vdev.class';
import { PoolManagerVdevDisk } from 'app/classes/pool-manager-disk.class';
import { ManagerVdevs } from 'app/pages/storage/components/manager/manager.component';

export class PoolManagerVdev extends ManagerVdev {
  disks: PoolManagerVdevDisk[];
  errorMsg: string;

  constructor(type: string, group: keyof ManagerVdevs) {
    super(type, group);
    this.disks = [];
  }
}
