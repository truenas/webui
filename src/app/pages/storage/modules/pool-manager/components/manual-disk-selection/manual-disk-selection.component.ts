import { NestedTreeControl } from '@angular/cdk/tree';
import { Component } from '@angular/core';
import { FormBuilder } from '@ngneat/reactive-forms';
import { Disk } from 'app/interfaces/storage.interface';
import { IxNestedTreeDataSource } from 'app/modules/ix-tree/ix-nested-tree-datasource';

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
  dataSource: IxNestedTreeDataSource<NestedEnclosureDiskNode>;
  treeControl = new NestedTreeControl<NestedEnclosureDiskNode, string>((vdev) => vdev.children, {
    trackBy: (vdev) => vdev.identifier,
  });
  form = this.fb.group({
    search: [''],
    diskType: [''],
    diskSize: [''],
  });

  data: NestedEnclosureDiskNode = {
    group: 'enclosure0',
    identifier: 'enclosure0',
    children: [
      {
        identifier: 'sda',
        children: [],
      } as unknown as EnclosureDisk,
    ],
  };

  constructor(
    private fb: FormBuilder,
  ) {
    this.dataSource = new IxNestedTreeDataSource([
      this.data,
    ]);
  }

  readonly isGroup = (_: number, node: NestedEnclosureDiskNode): boolean => 'group' in node;

  isExpanded(group: any): boolean {
    return this.treeControl.isExpanded(group);
  }
}
