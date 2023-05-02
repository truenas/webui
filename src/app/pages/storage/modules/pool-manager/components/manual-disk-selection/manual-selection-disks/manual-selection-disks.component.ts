import { NestedTreeControl } from '@angular/cdk/tree';
import {
  ChangeDetectionStrategy, Component, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { DndDropEvent } from 'ngx-drag-drop';
import { FileSizePipe } from 'ngx-filesize';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { PoolManagerVdevDisk } from 'app/classes/pool-manager-disk.class';
import { Enclosure } from 'app/interfaces/enclosure.interface';
import { Disk } from 'app/interfaces/storage.interface';
import { NestedTreeDataSource } from 'app/modules/ix-tree/nested-tree-datasource';
import {
  ManualDiskSelectionFilters,
} from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/manual-selection-disks/manual-selection-disk-filters/manual-selection-disk-filters.component';
import { ManualDiskSelectionStore } from 'app/pages/storage/modules/pool-manager/store/manual-disk-selection-store.service';

interface EnclosureDisk extends Disk {
  children: [];
}

interface EnclosureGroup {
  group: string;
  identifier: string;
  children: EnclosureDisk[];
}

type DiskOrGroup = EnclosureDisk | EnclosureGroup;

const noEnclosureId = 'no-enclosure' as const;

@UntilDestroy()
@Component({
  selector: 'ix-manual-selection-disks',
  templateUrl: './manual-selection-disks.component.html',
  styleUrls: ['./manual-selection-disks.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [FileSizePipe],
})
export class ManualSelectionDisksComponent implements OnInit {
  hasEnclosures = false;
  dataSource: NestedTreeDataSource<DiskOrGroup>;
  treeControl = new NestedTreeControl<DiskOrGroup, string>((node) => node.children, {
    trackBy: (node) => node.identifier,
  });

  filtersUpdated = new BehaviorSubject<ManualDiskSelectionFilters>({});

  constructor(
    private filesizePipe: FileSizePipe,
    private translate: TranslateService,
    public store$: ManualDiskSelectionStore,
  ) {}

  readonly isGroup = (i: number, node: DiskOrGroup): node is EnclosureGroup => 'group' in node;

  isExpanded(group: DiskOrGroup): boolean {
    return this.treeControl.isExpanded(group);
  }

  ngOnInit(): void {
    this.createDataSource();
  }

  asDisk(node: DiskOrGroup): Disk {
    return node as Disk;
  }

  asEnclosureGroup(node: DiskOrGroup): EnclosureGroup {
    return node as EnclosureGroup;
  }

  private createDataSource(): void {
    combineLatest([
      this.store$.enclosures$,
      this.store$.unusedDisks$,
      this.filtersUpdated,
    ])
      .pipe(untilDestroyed(this))
      .subscribe(([enclosures, disks, filterValues]) => {
        this.hasEnclosures = enclosures.length > 0;

        const filteredDisks = this.filterDisks(disks, filterValues);
        const disksInEnclosures = this.mapDisksToEnclosures(filteredDisks, enclosures);

        // Don't show enclosure header if there is only one enclosure
        const nodes = disksInEnclosures.length === 1
          ? disksInEnclosures[0].children
          : disksInEnclosures;

        this.dataSource = new NestedTreeDataSource(nodes);
      });
  }

  private mapDisksToEnclosures(disks: Disk[], enclosures: Enclosure[]): DiskOrGroup[] {
    const disksInEnclosures = enclosures.map((enclosure) => {
      return {
        group: `${enclosure.number}: ${enclosure.label}`,
        identifier: String(enclosure.number),
        children: [],
      };
    });

    // Add special empty enclosure
    disksInEnclosures.push({
      group: this.translate.instant('No enclosure'),
      identifier: noEnclosureId,
      children: [],
    });

    disks.forEach((disk) => {
      const enclosureId = disk.enclosure?.number !== undefined ? disk.enclosure?.number : noEnclosureId;
      const enclosure = disksInEnclosures.find((enclosureNode) => enclosureNode.identifier === String(enclosureId));
      if (!enclosure) {
        console.error('Enclosure not found', disk);
        return;
      }

      enclosure.children.push({
        ...disk,
        children: [],
      });
    });

    return disksInEnclosures;
  }

  private filterDisks(disks: Disk[], filterValues: ManualDiskSelectionFilters): Disk[] {
    return disks.filter((disk) => {
      const typeMatches = filterValues.diskType ? disk.type === filterValues.diskType : true;
      const sizeMatches = filterValues.diskSize
        ? this.filesizePipe.transform(disk.size, { standard: 'iec' }) === filterValues.diskSize
        : true;
      const searchMatches = filterValues.search
        ? (disk.model?.includes(filterValues.search) || disk.serial?.includes(filterValues.search))
        : true;

      return typeMatches && sizeMatches && searchMatches;
    });
  }

  onDrop(event: DndDropEvent): void {
    const disk = event.data as PoolManagerVdevDisk;
    this.store$.toggleActivateDrag(false);
    this.store$.removeDiskFromDataVdev(disk);
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
}
