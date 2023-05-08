import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { DndDropEvent } from 'ngx-drag-drop';
import { ManagerVdev } from 'app/classes/manager-vdev.class';
import { PoolManagerVdevDisk } from 'app/classes/pool-manager-disk.class';
import { PoolManagerVdev } from 'app/classes/pool-manager-vdev.class';
import { GiB, MiB } from 'app/constants/bytes.constant';
import { CreateVdevLayout } from 'app/enums/v-dev-type.enum';
import { ManagerDisk } from 'app/pages/storage/components/manager/manager-disk.interface';
import { ManualDiskSelectionStore } from 'app/pages/storage/modules/pool-manager/store/manual-disk-selection-store.service';

@UntilDestroy()
@Component({
  selector: 'ix-manual-selection-vdev',
  templateUrl: './manual-selection-vdev.component.html',
  styleUrls: ['./manual-selection-vdev.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManualSelectionVdevComponent implements OnInit {
  @Input() vdev: PoolManagerVdev;
  @Input() swapondrive = 2;
  enclosuresDisks = new Map<number, ManagerDisk[]>();
  nonEnclosureDisks: ManagerDisk[] = [];
  CreateVdevLayout = CreateVdevLayout;
  minDisks: { [key: string]: number } = {
    [CreateVdevLayout.Stripe]: 1,
    [CreateVdevLayout.Mirror]: 2,
    [CreateVdevLayout.Raidz1]: 3,
    [CreateVdevLayout.Raidz2]: 4,
    [CreateVdevLayout.Raidz3]: 5,
  };

  get spansEnclosures(): boolean {
    return !!this.enclosuresDisks.size
      && (this.enclosuresDisks.size > 1
        || !!this.nonEnclosureDisks.length);
  }
  constructor(
    private cdr: ChangeDetectorRef,
    public store$: ManualDiskSelectionStore,
  ) { }

  ngOnInit(): void {
    this.store$.dataVdevs$.pipe(untilDestroyed(this)).subscribe(() => {
      this.enclosuresDisks = new Map();
      this.nonEnclosureDisks = [];
      for (const disk of this.vdev?.disks) {
        if (disk.enclosure?.number || disk.enclosure?.number === 0) {
          let enclosureDisks = this.enclosuresDisks.get(disk.enclosure.number);
          if (!enclosureDisks) {
            enclosureDisks = [];
          }
          this.enclosuresDisks.set(disk.enclosure.number, [...enclosureDisks, disk]);
        } else {
          this.nonEnclosureDisks.push(disk);
        }
      }
      this.estimateSize(this.vdev);
      this.cdr.markForCheck();
    });
  }

  getMovableDisk(disk: ManagerDisk): PoolManagerVdevDisk {
    return {
      ...disk,
      vdevUuid: this.vdev.uuid,
    };
  }

  estimateSize(vdev: ManagerVdev): void {
    let totalsize = 0;
    let stripeSize = 0;
    let smallestdisk = 0;
    let estimate = 0;
    const swapsize = this.swapondrive * GiB;
    vdev.showDiskSizeError = false;
    for (let i = 0; i < vdev.disks.length; i++) {
      const size = vdev.disks[i].real_capacity - swapsize;
      stripeSize += size;
      if (i === 0) {
        smallestdisk = size;
      }
      const tenMib = 10 * MiB;
      if (size > smallestdisk + tenMib || size < smallestdisk - tenMib) {
        vdev.showDiskSizeError = true;
      }
      if (vdev.disks[i].real_capacity < smallestdisk) {
        smallestdisk = size;
      }
    }
    totalsize = smallestdisk * vdev.disks.length;

    if (vdev.type === CreateVdevLayout.Mirror) {
      estimate = smallestdisk;
    } else if (vdev.type === CreateVdevLayout.Raidz1) {
      estimate = totalsize - smallestdisk;
    } else if (vdev.type === CreateVdevLayout.Raidz2) {
      estimate = totalsize - 2 * smallestdisk;
    } else if (vdev.type === CreateVdevLayout.Raidz3) {
      estimate = totalsize - 3 * smallestdisk;
    } else {
      estimate = stripeSize; // stripe
    }

    vdev.rawSize = estimate;
    this.cdr.markForCheck();
  }

  onDragStart(): void {
    this.store$.toggleActivateDrag(true);
  }

  onDragEnd(): void {
    this.store$.toggleActivateDrag(false);
  }

  onDragCanceled(): void {
    this.store$.toggleActivateDrag(false);
  }

  deleteVdev(): void {
    this.store$.removeDataVdev(this.vdev);
  }

  onDrop(event: DndDropEvent): void {
    const disk = event.data as PoolManagerVdevDisk;
    if (!disk.vdevUuid && disk.vdevUuid === this.vdev.uuid) {
      return;
    }
    if (disk.vdevUuid) {
      this.store$.removeDiskFromDataVdev(disk);
    }
    this.store$.addDiskToDataVdev({ disk, vdev: this.vdev });
    this.store$.toggleActivateDrag(false);
    this.cdr.markForCheck();
  }
}
