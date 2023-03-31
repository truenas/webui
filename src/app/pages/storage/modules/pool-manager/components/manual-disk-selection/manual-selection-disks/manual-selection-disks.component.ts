import { NestedTreeControl } from '@angular/cdk/tree';
import {
  ChangeDetectionStrategy, Component, OnInit,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import { DndDropEvent } from 'ngx-drag-drop';
import { FileSizePipe } from 'ngx-filesize';
import { combineLatest } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { Enclosure } from 'app/interfaces/enclosure.interface';
import { Disk } from 'app/interfaces/storage.interface';
import { NestedTreeDataSource } from 'app/modules/ix-tree/nested-tree-datasource';
import { ManualDiskSelectionStore } from 'app/pages/storage/modules/pool-manager/store/manual-disk-selection-store.service';
import { VdevManagerDisk } from 'app/pages/storage/modules/pool-manager/store/pools-manager-store.service';

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
  filterForm = this.formBuilder.group({
    search: [''],
    diskType: [''],
    diskSize: [''],
  });

  hasEnclosures = false;
  dataSource: NestedTreeDataSource<DiskOrGroup>;
  treeControl = new NestedTreeControl<DiskOrGroup, string>((node) => node.children, {
    trackBy: (node) => node.identifier,
  });

  readonly typeOptions$ = this.store$.unusedDisks$.pipe(
    map((disks) => {
      const diskTypes = disks.map((disk) => disk.type);
      const uniqueTypes = _.uniq(diskTypes);
      // TODO: Consider extracting somewhere similar to arrayToOptions
      return uniqueTypes.map((type) => ({ label: type, value: type }));
    }),
  );

  readonly sizeOptions$ = this.store$.unusedDisks$.pipe(
    map((disks) => {
      const sizes = disks.map((disk) => this.filesizePipe.transform(disk.size, { standard: 'iec' }));
      const uniqueSizes = _.uniq(sizes);
      return uniqueSizes.map((size: string) => ({ label: size, value: size }));
    }),
  );

  constructor(
    private formBuilder: FormBuilder,
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
      this.filterForm.valueChanges.pipe(startWith(this.filterForm.value)),
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

  private filterDisks(disks: Disk[], filterValues: ManualSelectionDisksComponent['filterForm']['value']): Disk[] {
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
    const disk = event.data as VdevManagerDisk;
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
