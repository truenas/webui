import { ManagerVdev } from 'app/classes/manager-vdev.class';
import { PoolManagerVdevDisk } from 'app/classes/pool-manager-disk.class';
import { CreateVdevLayout } from 'app/enums/v-dev-type.enum';
import { ManagerVdevs } from 'app/pages/storage/components/manager/manager.component';

// TODO: Nuke
export class PoolManagerVdev extends ManagerVdev {
  disks: PoolManagerVdevDisk[];
  errorMsg: string;

  constructor(layout: CreateVdevLayout, group: keyof ManagerVdevs) {
    super(layout, group);
    this.disks = [];
  }
}
