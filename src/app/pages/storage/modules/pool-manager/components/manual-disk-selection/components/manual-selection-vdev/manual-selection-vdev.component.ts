import { NgClass, AsyncPipe, KeyValuePipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, input, OnChanges,
} from '@angular/core';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { keyBy } from 'lodash-es';
import { DndDropEvent, DndDropzoneDirective, DndDraggableDirective } from 'ngx-drag-drop';
import { MiB } from 'app/constants/bytes.constant';
import { CreateVdevLayout } from 'app/enums/v-dev-type.enum';
import { Enclosure } from 'app/interfaces/enclosure.interface';
import { DiskIconComponent } from 'app/modules/disk-icon/disk-icon.component';
import { IxLabelComponent } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.component';
import { WarningComponent } from 'app/modules/forms/ix-forms/components/warning/warning.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { EnclosureWrapperComponent } from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/components/enclosure-wrapper/enclosure-wrapper.component';
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
  standalone: true,
  imports: [
    MatCard,
    MatCardContent,
    DndDropzoneDirective,
    NgClass,
    WarningComponent,
    EnclosureWrapperComponent,
    DiskIconComponent,
    DndDraggableDirective,
    IxIconComponent,
    IxLabelComponent,
    TranslateModule,
    FileSizePipe,
    AsyncPipe,
    KeyValuePipe,
  ],
})
export class ManualSelectionVdevComponent implements OnChanges {
  readonly vdev = input<ManualSelectionVdev>();
  readonly layout = input<CreateVdevLayout>();
  readonly editable = input(false);

  readonly enclosures = input<Enclosure[]>();

  readonly enclosureById = computed(() => {
    return keyBy(this.enclosures(), 'id') as Record<string, Enclosure>;
  });

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
    this.estimateSize(this.vdev());
  }

  getMovableDisk(disk: ManualSelectionDisk): ManualSelectionDisk {
    return {
      ...disk,
      vdevUuid: this.vdev().uuid,
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
    this.store$.removeVdev(this.vdev());
  }

  onDrop(event: DndDropEvent): void {
    const disk = event.data as ManualSelectionDisk;
    if (!disk.vdevUuid && disk.vdevUuid === this.vdev().uuid) {
      return;
    }
    if (disk.vdevUuid) {
      this.store$.removeDiskFromVdev(disk);
    }
    this.store$.addDiskToVdev({ disk, vdev: this.vdev() });
    this.dragToggleStore$.toggleActivateDrag(false);
    this.cdr.markForCheck();
  }

  private estimateSize(vdev: ManualSelectionVdev): void {
    this.sizeEstimation = vdevCapacity({
      vdev: vdev.disks,
      layout: this.layout(),
    });
  }

  private groupDisksByEnclosure(): void {
    this.enclosuresDisks = new Map();
    this.nonEnclosureDisks = [];
    if (!this.vdev()?.disks) {
      return;
    }

    for (const disk of this.vdev().disks) {
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
    if (this.vdev().disks?.length < this.minDisks[this.layout()]) {
      const typeKey = Object.entries(CreateVdevLayout).filter(
        ([, value]) => value === this.layout(),
      ).map(([key]) => key)[0];
      vdevErrorMsg = this.translate.instant(
        'Atleast {min} disk(s) are required for {vdevType} vdevs',
        { min: this.minDisks[this.layout()], vdevType: typeKey },
      );
    }
    this.vdevErrorMessage = vdevErrorMsg;

    this.mixesDisksOfDifferentSizes = false;
    const firstDisk = this.vdev().disks[0];
    for (const disk of this.vdev().disks) {
      const threshold = 10 * MiB;
      if (disk.size < firstDisk.size + threshold && disk.size > firstDisk.size - threshold) {
        continue;
      }

      this.mixesDisksOfDifferentSizes = true;
    }
  }
}
