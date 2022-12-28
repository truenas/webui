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
      {
        ...this.data,
        group: 'enclosure2',
        identifier: 'enclosure2',
        children: [
          {
            identifier: 'sdb',
            children: [],
          } as unknown as EnclosureDisk,
          {
            identifier: 'sdc',
            children: [],
          } as unknown as EnclosureDisk,
          {
            identifier: 'sdd',
            children: [],
          } as unknown as EnclosureDisk,
        ],
      },
      {
        ...this.data,
        group: 'enclosure3',
        identifier: 'enclosure3',
        children: [
          {
            identifier: 'sdb',
            children: [],
          } as unknown as EnclosureDisk,
          {
            identifier: 'sdc',
            children: [],
          } as unknown as EnclosureDisk,
          {
            identifier: 'sdd',
            children: [],
          } as unknown as EnclosureDisk,
        ],
      },
      {
        ...this.data,
        group: 'enclosure4',
        identifier: 'enclosure4',
        children: [
          {
            identifier: 'sdb',
            children: [],
          } as unknown as EnclosureDisk,
          {
            identifier: 'sdc',
            children: [],
          } as unknown as EnclosureDisk,
          {
            identifier: 'sdd',
            children: [],
          } as unknown as EnclosureDisk,
        ],
      },
      {
        ...this.data,
        group: 'enclosure5',
        identifier: 'enclosure5',
        children: [
          {
            identifier: 'sdb',
            children: [],
          } as unknown as EnclosureDisk,
          {
            identifier: 'sdc',
            children: [],
          } as unknown as EnclosureDisk,
          {
            identifier: 'sdd',
            children: [],
          } as unknown as EnclosureDisk,
        ],
      },
      {
        ...this.data,
        group: 'enclosure6',
        identifier: 'enclosure6',
        children: [
          {
            identifier: 'sdb',
            children: [],
          } as unknown as EnclosureDisk,
          {
            identifier: 'sdc',
            children: [],
          } as unknown as EnclosureDisk,
          {
            identifier: 'sdd',
            children: [],
          } as unknown as EnclosureDisk,
        ],
      },
      {
        ...this.data,
        group: 'enclosure7',
        identifier: 'enclosure7',
        children: [
          {
            identifier: 'sdb',
            children: [],
          } as unknown as EnclosureDisk,
          {
            identifier: 'sdc',
            children: [],
          } as unknown as EnclosureDisk,
          {
            identifier: 'sdd',
            children: [],
          } as unknown as EnclosureDisk,
        ],
      },
    ]);
  }

  readonly isGroup = (_: number, node: NestedEnclosureDiskNode): boolean => 'group' in node;

  isExpanded(group: any): boolean {
    return this.treeControl.isExpanded(group);
  }
}
