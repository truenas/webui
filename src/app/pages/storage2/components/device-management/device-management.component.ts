import { Component } from '@angular/core';
import { PoolDiskInfo } from 'app/interfaces/pool-disk-info';

@Component({
  selector: 'ix-device-management',
  templateUrl: './device-management.component.html',
  styleUrls: ['./device-management.component.scss'],
})
export class DeviceManagementComponent {
  /** Object to be passed on to the detail pane cards */
  poolDiskInfo: PoolDiskInfo = {
    name: 'sdb',
    read: 0,
    write: 0,
    checksum: 0,
    status: 'ONLINE',
    path: '/dev/disk/by-partuuid/e53a198f-5152-4296-a36c-510c173858d5',
    guid: '14313996386566657719',
  };
}
