import { NestedTreeControl } from '@angular/cdk/tree';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { Observable, of } from 'rxjs';
import { Option } from 'app/interfaces/option.interface';
import { Disk } from 'app/interfaces/storage.interface';
import { NestedTreeDataSource } from 'app/modules/ix-tree/nested-tree-datasource';
import { SystemProfiler } from 'app/pages/system/view-enclosure/classes/system-profiler';
import { StorageService } from 'app/services';

interface EnclosureDisk extends Disk {
  children: [];
}

interface EnclosureGroup {
  group: string;
  identifier: string;
  children: EnclosureDisk[];
}

type NestedEnclosureDiskNode = EnclosureDisk | EnclosureGroup;

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

  typeOptions$: Observable<Option[]>;
  sizeOptions$: Observable<Option[]>;

  constructor(
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: SystemProfiler,
    private storage: StorageService,
  ) {
    const disksData: NestedEnclosureDiskNode[] = this.data.profile.map((enclosure, index) => {
      return {
        group: `Enclosure ${index}`,
        identifier: `Enclosure ${index}`,
        children: enclosure.disks.sort((first, second) => {
          return first.enclosure.slot > second.enclosure.slot ? 1 : -1;
        }).map((disk) => ({ ...disk, children: [], identifier: disk.name })) as EnclosureDisk[],
      };
    });
    this.dataSource = new NestedTreeDataSource(disksData);
    const typeOptions: Option[] = this.data.diskData
      .map((disk) => disk.type)
      .filter((value, index, self) => self.indexOf(value) === index)
      .map((type) => ({ label: type, value: type }));
    this.typeOptions$ = of(typeOptions);
    const sizeOptions: Option[] = this.data.diskData
      .map((disk) => this.storage.convertBytesToHumanReadable(disk.size, 1))
      .filter((value, index, self) => self.indexOf(value) === index)
      .map((size) => ({ label: size, value: size }));

    this.sizeOptions$ = of(sizeOptions);
  }

  readonly isGroup = (_: number, node: NestedEnclosureDiskNode): boolean => 'group' in node;

  isExpanded(group: NestedEnclosureDiskNode): boolean {
    return this.treeControl.isExpanded(group);
  }

  getDiskType(disk: unknown): string {
    return (disk as Disk).type;
  }

  getDiskModel(disk: unknown): string {
    return (disk as Disk).model;
  }

  getDiskSlot(disk: unknown): number {
    return (disk as Disk).enclosure.slot;
  }

  getDiskSerial(disk: unknown): string {
    return (disk as Disk).serial;
  }

  getDiskSizeStr(disk: unknown): string {
    return this.storage.convertBytesToHumanReadable((disk as Disk).size, 1);
  }
}
