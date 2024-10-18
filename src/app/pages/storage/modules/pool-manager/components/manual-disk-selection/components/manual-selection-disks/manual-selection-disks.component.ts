import { NestedTreeControl } from '@angular/cdk/tree';
import { NgClass, AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, Input, OnInit,
} from '@angular/core';
import { RouterLinkActive } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  DndDropEvent, DndDropzoneDirective, DndDraggableDirective, DndDragImageRefDirective,
} from 'ngx-drag-drop';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { buildNormalizedFileSize } from 'app/helpers/file-size.utils';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { Enclosure } from 'app/interfaces/enclosure.interface';
import { DiskIconComponent } from 'app/modules/disk-icon/disk-icon.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { NestedTreeNodeComponent } from 'app/modules/ix-tree/components/nested-tree-node/nested-tree-node.component';
import { TreeNodeComponent } from 'app/modules/ix-tree/components/tree-node/tree-node.component';
import { TreeViewComponent } from 'app/modules/ix-tree/components/tree-view/tree-view.component';
import { TreeNodeDefDirective } from 'app/modules/ix-tree/directives/tree-node-def.directive';
import { TreeNodeOutletDirective } from 'app/modules/ix-tree/directives/tree-node-outlet.directive';
import { TreeNodeToggleDirective } from 'app/modules/ix-tree/directives/tree-node-toggle.directive';
import { NestedTreeDataSource } from 'app/modules/ix-tree/nested-tree-datasource';
import { DiskInfoComponent } from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/components/disk-info/disk-info.component';
import {
  ManualDiskSelectionFilters,
} from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/components/manual-selection-disks/manual-selection-disk-filters/manual-selection-disk-filters.component';
import {
  ManualSelectionDisk,
} from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/interfaces/manual-disk-selection.interface';
import { ManualDiskDragToggleStore } from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/store/manual-disk-drag-toggle.store';
import { ManualDiskSelectionStore } from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/store/manual-disk-selection.store';
import { ManualSelectionDiskFiltersComponent } from './manual-selection-disk-filters/manual-selection-disk-filters.component';

interface EnclosureDisk extends DetailsDisk {
  children: [];
}

interface EnclosureGroup {
  group: string;
  identifier: string;
  children: EnclosureDisk[];
}

type DiskOrGroup = EnclosureDisk | EnclosureGroup;

const noEnclosureId = 'no-enclosure';

@UntilDestroy()
@Component({
  selector: 'ix-manual-selection-disks',
  templateUrl: './manual-selection-disks.component.html',
  styleUrls: ['./manual-selection-disks.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ManualSelectionDiskFiltersComponent,
    DndDropzoneDirective,
    NgClass,
    RouterLinkActive,
    DndDraggableDirective,
    DiskIconComponent,
    DndDragImageRefDirective,
    DiskInfoComponent,
    IxIconComponent,
    TranslateModule,
    AsyncPipe,
    TreeViewComponent,
    TreeNodeComponent,
    NestedTreeNodeComponent,
    TreeNodeDefDirective,
    TreeNodeToggleDirective,
    TreeNodeOutletDirective,
  ],
})
export class ManualSelectionDisksComponent implements OnInit {
  @Input() enclosures: Enclosure[] = [];

  dataSource: NestedTreeDataSource<DiskOrGroup>;
  treeControl = new NestedTreeControl<DiskOrGroup, string>((node) => node.children, {
    trackBy: (node) => node.identifier,
  });

  filtersUpdated = new BehaviorSubject<ManualDiskSelectionFilters>({});

  constructor(
    private translate: TranslateService,
    protected store$: ManualDiskSelectionStore,
    protected dragToggleStore$: ManualDiskDragToggleStore,
  ) {}

  readonly isGroup = (_: number, node: DiskOrGroup): node is EnclosureGroup => 'group' in node;

  isExpanded(group: DiskOrGroup): boolean {
    return this.treeControl.isExpanded(group);
  }

  ngOnInit(): void {
    this.createDataSource();
  }

  asDisk(node: DiskOrGroup): DetailsDisk {
    return node as DetailsDisk;
  }

  asEnclosureGroup(node: DiskOrGroup): EnclosureGroup {
    return node as EnclosureGroup;
  }

  private createDataSource(): void {
    combineLatest([
      this.store$.inventory$,
      this.filtersUpdated,
    ])
      .pipe(untilDestroyed(this))
      .subscribe(([disks, filterValues]) => {
        const filteredDisks = this.filterDisks(disks, filterValues);
        const disksInEnclosures = this.mapDisksToEnclosures(filteredDisks, this.enclosures);

        // Don't show enclosure header if there is only one enclosure
        const nodes = disksInEnclosures.length === 1
          ? disksInEnclosures[0].children
          : disksInEnclosures;

        this.dataSource = new NestedTreeDataSource(nodes);
      });
  }

  private mapDisksToEnclosures(disks: DetailsDisk[], enclosures: Enclosure[]): DiskOrGroup[] {
    const disksInEnclosures = enclosures.map((enclosure) => {
      // Match behavior of enclosure-disks component
      return {
        group: enclosure.label || enclosure.name,
        identifier: enclosure.id,
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
      const enclosureId = disk.enclosure?.id !== undefined ? disk.enclosure?.id : noEnclosureId;
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

  private filterDisks(disks: DetailsDisk[], filterValues: ManualDiskSelectionFilters): DetailsDisk[] {
    return disks.filter((disk) => {
      const typeMatches = filterValues.diskType ? disk.type === filterValues.diskType : true;
      const sizeMatches = filterValues.diskSize
        ? buildNormalizedFileSize(disk.size) === filterValues.diskSize
        : true;
      const diskModalStringNormalized = disk.model?.toLowerCase().trim() || '';
      const searchStringNormalized = filterValues.search?.toLowerCase().trim() || '';
      const diskSerialStringNormalized = disk.serial?.toLowerCase().trim() || '';
      const diskNameNormalized = disk.name?.toLowerCase().trim() || '';
      const searchMatches = filterValues.search
        ? (
            diskModalStringNormalized.includes(searchStringNormalized)
            || diskSerialStringNormalized.includes(searchStringNormalized)
            || diskNameNormalized.includes(searchStringNormalized)
          )
        : true;

      return typeMatches && sizeMatches && searchMatches;
    });
  }

  onDrop(event: DndDropEvent): void {
    const disk = event.data as ManualSelectionDisk;
    this.dragToggleStore$.toggleActivateDrag(false);
    this.store$.removeDiskFromVdev(disk);
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
}
