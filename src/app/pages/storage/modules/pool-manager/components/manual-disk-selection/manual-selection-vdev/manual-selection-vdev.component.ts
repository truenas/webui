import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { GiB, MiB } from 'app/constants/bytes.constant';
import { ManagerVdev } from 'app/interfaces/vdev-info.interface';
import { IxFormatterService } from 'app/modules/ix-forms/services/ix-formatter.service';
import { ManagerDisk } from 'app/pages/storage/components/manager/manager-disk.interface';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pools-manager-store.service';

@UntilDestroy()
@Component({
  selector: 'ix-manual-selection-vdev',
  templateUrl: './manual-selection-vdev.component.html',
  styleUrls: ['./manual-selection-vdev.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManualSelectionVdevComponent implements OnInit {
  @Input() vdev: ManagerVdev;
  @Input() swapondrive = 2;
  enclosuresDisks = new Map<number, ManagerDisk[]>();

  get spansEnclosures(): boolean {
    if (!this.vdev.disks.length) {
      return false;
    }
    const enclosure = this.vdev.disks[0].enclosure;
    return this.vdev.disks.some(
      (disk) => disk.enclosure.number !== enclosure.number,
    );
  }
  constructor(
    public ixFormatter: IxFormatterService,
    private cdr: ChangeDetectorRef,
    private store$: PoolManagerStore,
  ) {}

  ngOnInit(): void {
    this.store$.dataVdevs$.pipe(untilDestroyed(this)).subscribe(() => {
      this.enclosuresDisks = new Map();
      for (const disk of this.vdev?.disks) {
        let enclosure = this.enclosuresDisks.get(disk.enclosure.number);
        if (!enclosure) {
          enclosure = [];
        }
        this.enclosuresDisks.set(disk.enclosure.number, [...enclosure, disk]);
      }
      if (this.enclosuresDisks.size === 0) {
        this.enclosuresDisks.set(0, []);
      }
      this.estimateSize(this.vdev);
      this.cdr.markForCheck();
    });
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

    if (vdev.type === 'mirror') {
      estimate = smallestdisk;
    } else if (vdev.type === 'raidz') {
      estimate = totalsize - smallestdisk;
    } else if (vdev.type === 'raidz2') {
      estimate = totalsize - 2 * smallestdisk;
    } else if (vdev.type === 'raidz3') {
      estimate = totalsize - 3 * smallestdisk;
    } else {
      estimate = stripeSize; // stripe
    }

    vdev.rawSize = estimate;
  }
}
