import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { keyBy } from 'lodash-es';
import { DndDropEvent } from 'ngx-drag-drop';
import { MiB } from 'app/constants/bytes.constant';
import { CreateVdevLayout } from 'app/enums/v-dev-type.enum';
import { Enclosure } from 'app/interfaces/enclosure.interface';
import {
  ManualSelectionDisk,
  ManualSelectionVdev,
} from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/interfaces/manual-disk-selection.interface';
import { ManualDiskDragToggleStore as ManualDiskSelectionDragToggleStore } from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/store/manual-disk-drag-toggle.store';
import { ManualDiskSelectionStore } from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/store/manual-disk-selection.store';
import { vdevCapacity } from 'app/pages/storage/modules/pool-manager/utils/capacity.utils';
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

  @Input() set enclosures(enclosures: Enclosure[]) {
    this.enclosureById = keyBy(enclosures, 'id');
  }

  protected enclosureById: Record<string, Enclosure> = {};
  protected sizeEstimation = 0;

  protected vdevErrorMessage = '';
  protected mixesDisksOfDifferentSizes = false;

  protected enclosuresDisks = new Map<string, ManualSelectionDisk[]>();
  protected nonEnclosureDisks: ManualSelectionDisk[] = [];
  protected minDisks = minDisksPerLayout;

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
    this.validateVdev();
    this.groupDisksByEnclosure();
    this.estimateSize(this.vdev);
  }

  getMovableDisk(disk: ManualSelectionDisk): ManualSelectionDisk {
    return {
      ...disk,
      vdevUuid: this.vdev.uuid,
    };
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

  private estimateSize(vdev: ManualSelectionVdev): void {
    this.sizeEstimation = vdevCapacity({
      vdev: vdev.disks,
      layout: this.layout,
    });
  }

  private groupDisksByEnclosure(): void {
    this.enclosuresDisks = new Map();
    this.nonEnclosureDisks = [];
    if (!this.vdev?.disks) {
      return;
    }

    for (const disk of this.vdev.disks) {
      if (disk.enclosure?.id) {
        let enclosureDisks = this.enclosuresDisks.get(disk.enclosure.id);
        if (!enclosureDisks) {
          enclosureDisks = [];
        }
        this.enclosuresDisks.set(disk.enclosure.id, [...enclosureDisks, disk]);
      } else {
        this.nonEnclosureDisks.push(disk);
      }
    }
  }

  private validateVdev(): void {
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
    this.vdevErrorMessage = vdevErrorMsg;

    this.mixesDisksOfDifferentSizes = false;
    const firstDisk = this.vdev.disks[0];
    for (const disk of this.vdev.disks) {
      const threshold = 10 * MiB;
      if (disk.size < firstDisk.size + threshold && disk.size > firstDisk.size - threshold) {
        continue;
      }

      this.mixesDisksOfDifferentSizes = true;
    }
  }
}
