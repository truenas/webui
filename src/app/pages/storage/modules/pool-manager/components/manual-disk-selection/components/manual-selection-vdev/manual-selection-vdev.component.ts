import { NgClass, AsyncPipe, KeyValuePipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, input, inject,
} from '@angular/core';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { TnCardComponent, TnIconButtonComponent, TnTestIdDirective } from '@truenas/ui-components';
import { keyBy } from 'lodash-es';
import { DndDropEvent, DndDropzoneDirective, DndDraggableDirective } from 'ngx-drag-drop';
import { MiB } from 'app/constants/bytes.constant';
import { CreateVdevLayout } from 'app/enums/v-dev-type.enum';
import { Enclosure } from 'app/interfaces/enclosure.interface';
import { DiskIconComponent } from 'app/modules/disk-icon/disk-icon.component';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { WarningComponent } from 'app/modules/warning/warning.component';
import { EnclosureWrapperComponent } from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/components/enclosure-wrapper/enclosure-wrapper.component';
import {
  ManualSelectionDisk,
  ManualSelectionVdev,
} from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/interfaces/manual-disk-selection.interface';
import { ManualDiskDragToggleStore as ManualDiskSelectionDragToggleStore } from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/store/manual-disk-drag-toggle.store';
import { ManualDiskSelectionStore } from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/store/manual-disk-selection.store';
import { vdevCapacity } from 'app/pages/storage/modules/pool-manager/utils/capacity.utils';
import { minDisksPerLayout } from 'app/pages/storage/modules/pool-manager/utils/min-disks-per-layout.constant';

@Component({
  selector: 'ix-manual-selection-vdev',
  templateUrl: './manual-selection-vdev.component.html',
  styleUrls: ['./manual-selection-vdev.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    DndDropzoneDirective,
    NgClass,
    WarningComponent,
    EnclosureWrapperComponent,
    DiskIconComponent,
    DndDraggableDirective,
    TnIconButtonComponent,
    TnTestIdDirective,
    TranslateModule,
    FileSizePipe,
    AsyncPipe,
    KeyValuePipe,
  ],
})
export class ManualSelectionVdevComponent {
  private cdr = inject(ChangeDetectorRef);
  protected store$ = inject(ManualDiskSelectionStore);
  private translate = inject(TranslateService);
  protected dragToggleStore$ = inject(ManualDiskSelectionDragToggleStore);

  readonly vdev = input.required<ManualSelectionVdev>();
  readonly layout = input.required<CreateVdevLayout>();
  readonly editable = input(false);

  /**
   * 1-based position of this vdev within its list, used to disambiguate the delete button.
   * Every card in a list shares the same {@link layout}, so without it all of them resolve to
   * one `data-test` value (a Playwright strict-mode violation) and to the same accessible name.
   *
   * Required rather than defaulted: a default of `1` silently re-creates that collision for any
   * caller that forgets to pass it, and only `editable` callers would notice (the delete button
   * is the sole consumer).
   */
  readonly position = input.required<number>();

  readonly enclosures = input<Enclosure[]>();

  readonly enclosureById = computed(() => {
    return keyBy(this.enclosures(), 'id') as Record<string, Enclosure>;
  });

  protected minDisks = minDisksPerLayout;

  protected readonly sizeEstimation = computed(() => {
    return vdevCapacity({
      vdev: this.vdev().disks,
      layout: this.layout(),
    });
  });

  protected readonly vdevErrorMessage = computed(() => {
    const layout = this.layout();
    if (this.vdev().disks?.length < this.minDisks[layout]) {
      const typeKey = Object.entries(CreateVdevLayout).filter(
        ([, value]) => value === layout,
      ).map(([key]) => key)[0];
      return this.translate.instant(
        'At least {min} disk(s) are required for {vdevType} vdevs',
        { min: this.minDisks[layout], vdevType: typeKey },
      );
    }
    return '';
  });

  protected readonly mixesDisksOfDifferentSizes = computed(() => {
    const disks = this.vdev().disks;
    const firstDisk = disks[0];
    const threshold = 10 * MiB;
    return disks.some((disk) => {
      return disk.size >= firstDisk.size + threshold || disk.size <= firstDisk.size - threshold;
    });
  });

  private readonly disksByEnclosure = computed(() => {
    const enclosuresDisks = new Map<string, ManualSelectionDisk[]>();
    const nonEnclosureDisks: ManualSelectionDisk[] = [];

    for (const disk of this.vdev()?.disks || []) {
      if (disk.enclosure?.id) {
        enclosuresDisks.set(disk.enclosure.id, [...(enclosuresDisks.get(disk.enclosure.id) || []), disk]);
      } else {
        nonEnclosureDisks.push(disk);
      }
    }

    return { enclosuresDisks, nonEnclosureDisks };
  });

  protected readonly enclosuresDisks = computed(() => this.disksByEnclosure().enclosuresDisks);
  protected readonly nonEnclosureDisks = computed(() => this.disksByEnclosure().nonEnclosureDisks);

  protected readonly spansEnclosures = computed(() => {
    return !!this.enclosuresDisks().size
      && (this.enclosuresDisks().size > 1 || !!this.nonEnclosureDisks().length);
  });

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
}
