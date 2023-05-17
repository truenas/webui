import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { DndDropEvent } from 'ngx-drag-drop';
import { PoolManagerVdevDisk } from 'app/classes/pool-manager-disk.class';
import { GiB, MiB } from 'app/constants/bytes.constant';
import { CreateVdevLayout } from 'app/enums/v-dev-type.enum';
import {
  ManualSelectionDisk,
  ManualSelectionVdev,
} from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/interfaces/manual-disk-selection.interface';
import { ManualDiskSelectionStore } from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/store/manual-disk-selection.store';
import { minDisksPerLayout } from 'app/pages/storage/modules/pool-manager/utils/min-disks-per-layout.constant';

@UntilDestroy()
@Component({
  selector: 'ix-manual-selection-vdev',
  templateUrl: './manual-selection-vdev.component.html',
  styleUrls: ['./manual-selection-vdev.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManualSelectionVdevComponent implements OnInit {
  @Input() vdev: ManualSelectionVdev;
  @Input() layout: CreateVdevLayout;
  @Input() swapondrive = 2;

  enclosuresDisks = new Map<number, ManualSelectionDisk[]>();
  nonEnclosureDisks: ManualSelectionDisk[] = [];
  minDisks = minDisksPerLayout;

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
    this.store$.vdevs$.pipe(untilDestroyed(this)).subscribe(() => {
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

  getMovableDisk(disk: ManualSelectionDisk): ManualSelectionDisk {
    return {
      ...disk,
      vdevUuid: this.vdev.uuid,
    };
  }

  estimateSize(vdev: ManualSelectionVdev): void {
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

    switch (this.layout) {
      case CreateVdevLayout.Mirror:
        estimate = smallestdisk;
        break;
      case CreateVdevLayout.Raidz1:
        estimate = totalsize - smallestdisk;
        break;
      case CreateVdevLayout.Raidz2:
        estimate = totalsize - 2 * smallestdisk;
        break;
      case CreateVdevLayout.Raidz3:
        estimate = totalsize - 3 * smallestdisk;
        break;
      default:
        estimate = stripeSize;
        break;
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
    this.store$.removeVdev(this.vdev);
  }

  onDrop(event: DndDropEvent): void {
    const disk = event.data as PoolManagerVdevDisk;
    if (!disk.vdevUuid && disk.vdevUuid === this.vdev.uuid) {
      return;
    }
    if (disk.vdevUuid) {
      this.store$.removeDiskFromVdev(disk);
    }
    this.store$.addDiskToVdev({ disk, vdev: this.vdev });
    this.store$.toggleActivateDrag(false);
    this.cdr.markForCheck();
  }
}
