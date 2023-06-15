import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { DndDropEvent } from 'ngx-drag-drop';
import { GiB, MiB } from 'app/constants/bytes.constant';
import { CreateVdevLayout } from 'app/enums/v-dev-type.enum';
import {
  ManualSelectionDisk,
  ManualSelectionVdev,
} from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/interfaces/manual-disk-selection.interface';
import { ManualDiskDragToggleStore as ManualDiskSelectionDragToggleStore } from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/store/manual-disk-drag-toggle.store';
import { ManualDiskSelectionStore } from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/store/manual-disk-selection.store';
import { minDisksPerLayout } from 'app/pages/storage/modules/pool-manager/utils/min-disks-per-layout.constant';

@UntilDestroy()
@Component({
  selector: 'ix-manual-selection-vdev',
  templateUrl: './manual-selection-vdev.component.html',
  styleUrls: ['./manual-selection-vdev.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManualSelectionVdevComponent implements OnChanges {
  @Input() vdev: ManualSelectionVdev;
  @Input() layout: CreateVdevLayout;
  @Input() editable = false;
  @Input() swapondrive = 2;

  vdevErrMsg = '';
  showDiskSizeError = false;

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
    protected store$: ManualDiskSelectionStore,
    private translate: TranslateService,
    protected dragToggleStore$: ManualDiskSelectionDragToggleStore,
  ) { }

  ngOnChanges(): void {
    let vdevErrorMsg: string = null;
    if (this.vdev.disks?.length < this.minDisks[this.layout]) {
      const typeKey = Object.entries(CreateVdevLayout).filter(
        ([, value]) => value === this.layout,
      ).map(([key]) => key)[0];
      vdevErrorMsg = this.translate.instant(
        'Atleast {min} disk(s) are required for {vdevType} vdevs',
        { min: this.minDisks[this.layout], vdevType: typeKey },
      );
    }
    this.vdevErrMsg = vdevErrorMsg;

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
    this.showDiskSizeError = false;
    for (let i = 0; i < vdev.disks.length; i++) {
      const size = vdev.disks[i].size - swapsize;
      stripeSize += size;
      if (i === 0) {
        smallestdisk = size;
      }
      const tenMib = 10 * MiB;
      if (size > smallestdisk + tenMib || size < smallestdisk - tenMib) {
        this.showDiskSizeError = true;
      }
      if (vdev.disks[i].size < smallestdisk) {
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
    this.dragToggleStore$.toggleActivateDrag(true);
  }

  onDragEnd(): void {
    this.dragToggleStore$.toggleActivateDrag(false);
  }

  onDragCanceled(): void {
    this.dragToggleStore$.toggleActivateDrag(false);
  }

  deleteVdev(): void {
    this.store$.removeVdev(this.vdev);
  }

  onDrop(event: DndDropEvent): void {
    const disk = event.data as ManualSelectionDisk;
    if (!disk.vdevUuid && disk.vdevUuid === this.vdev.uuid) {
      return;
    }
    if (disk.vdevUuid) {
      this.store$.removeDiskFromVdev(disk);
    }
    this.store$.addDiskToVdev({ disk, vdev: this.vdev });
    this.dragToggleStore$.toggleActivateDrag(false);
    this.cdr.markForCheck();
  }
}
