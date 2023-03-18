import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { DndDropEvent } from 'ngx-drag-drop';
import { ManagerVdev } from 'app/interfaces/vdev-info.interface';
import { ManagerDisk } from 'app/pages/storage/components/manager/manager-disk.interface';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pools-manager-store.service';

@UntilDestroy()
@Component({
  selector: 'ix-vdev-wrapper',
  templateUrl: './vdev-wrapper.component.html',
  styleUrls: ['./vdev-wrapper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VdevWrapperComponent {
  @Input() enclosure: number;
  @Input() vdev: ManagerVdev;

  get vdevDisksLength(): boolean {
    return !!this.vdev.disks.length;
  }
  constructor(
    public store$: PoolManagerStore,
    private cdr: ChangeDetectorRef,
  ) { }

  onDrop(event: DndDropEvent): void {
    const disk = event.data as ManagerDisk;
    this.store$.addToDataVdev({ disk, vdev: this.vdev });
    this.store$.toggleActivateDrag(false);
    this.cdr.markForCheck();
  }
}
