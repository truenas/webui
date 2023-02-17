import { NestedTreeControl } from '@angular/cdk/tree';
import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import _ from 'lodash';
import { FileSizePipe } from 'ngx-filesize';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { Disk } from 'app/interfaces/storage.interface';
import { NestedTreeDataSource } from 'app/modules/ix-tree/nested-tree-datasource';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pools-manager-store.service';

interface EnclosureDisk extends Disk {
  children: [];
}

interface EnclosureGroup {
  group: string;
  identifier: string;
  children: EnclosureDisk[];
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ManualDiskSelectionLayout {
  // TODO:
}

type NestedEnclosureDiskNode = EnclosureDisk | EnclosureGroup;

@UntilDestroy()
@Component({
  selector: 'ix-manual-disk-selection',
  templateUrl: './manual-disk-selection.component.html',
  styleUrls: ['./manual-disk-selection.component.scss'],
})
export class ManualDiskSelectionComponent {
  search: string;
  selectedNode: EnclosureDisk;
  dataSource: NestedTreeDataSource<NestedEnclosureDiskNode>;
  treeControl = new NestedTreeControl<NestedEnclosureDiskNode, string>((vdev) => vdev.children, {
    trackBy: (vdev) => vdev.identifier,
  });
  form = this.fb.group({
    search: [''],
    diskType: [''],
    diskSize: [''],
  });

  // TODO: Extract sidebar somewhere.
  typeOptions$ = this.store.unusedDisks$.pipe(
    map((disks) => {
      const diskTypes = disks.map((disk) => disk.type);
      const uniqueTypes = _.uniq(diskTypes);
      // TODO: Consider extracting somewhere similar to arrayToOptions
      return uniqueTypes.map((type) => ({ label: type, value: type }));
    }),
  );

  sizeOptions$ = this.store.unusedDisks$.pipe(
    map((disks) => {
      const sizes = disks.map((disk) => this.filesizePipe.transform(disk.size, { standard: 'iec' }));
      const uniqueSizes = _.uniq(sizes);
      return uniqueSizes.map((size: string) => ({ label: size, value: size }));
    }),
  );

  constructor(
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: ManualDiskSelectionLayout,
    private filesizePipe: FileSizePipe,
    private dialogRef: MatDialogRef<ManualDiskSelectionComponent>,
    private store: PoolManagerStore,
  ) {
    this.createDataSource();
  }

  readonly isGroup = (i: number, node: NestedEnclosureDiskNode): boolean => 'group' in node;

  isExpanded(group: NestedEnclosureDiskNode): boolean {
    return this.treeControl.isExpanded(group);
  }

  onSaveSelection(): void {
    // TODO: Return currently selected layout (ManualDiskSelectionLayout).
    this.dialogRef.close();
  }

  private createDataSource(): void {
    combineLatest([
      this.store.enclosures$,
      this.store.unusedDisks$,
    ])
      .pipe(untilDestroyed(this))
      .subscribe(([enclosures, disks]) => {
        const disksInEnclosures: NestedEnclosureDiskNode[] = enclosures.map((enclosure) => {
          const enclosureDisks = disks
            .filter((disk) => disk.enclosure.number === enclosure.number) // TODO: Slow?
            .sort((a, b) => a.enclosure.slot - b.enclosure.slot) // TODO: Check
            .map((disk) => ({ ...disk, children: [], identifier: disk.name }) as EnclosureDisk);

          return {
            group: `Enclosure ${enclosure.number}`, // TODO: Translate and use enclosure name.
            identifier: `Enclosure ${enclosure.number}`,
            children: enclosureDisks,
          };
        });

        this.dataSource = new NestedTreeDataSource(disksInEnclosures);
      });
  }
}
