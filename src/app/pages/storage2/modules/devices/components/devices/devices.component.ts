import { NestedTreeControl } from '@angular/cdk/tree';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, TrackByFunction,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { VDevType } from 'app/enums/v-dev-type.enum';
import { PoolTopology } from 'app/interfaces/pool.interface';
import { VDev } from 'app/interfaces/storage.interface';
import { IxNestedTreeDataSource } from 'app/modules/ix-tree/ix-nested-tree-datasource';
import { findInTree } from 'app/modules/ix-tree/utils/find-in-tree.utils';
import { AppLoaderService, WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  templateUrl: './devices.component.html',
  styleUrls: ['./devices.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DevicesComponent implements OnInit {
  selectedDevice: VDev;
  selectedDeviceParent: VDev | undefined;

  topology: PoolTopology;
  dataSource: IxNestedTreeDataSource<VDev>;
  treeControl = new NestedTreeControl<VDev, string>((device) => device.children, {
    trackBy: (device) => device.guid,
  });
  readonly trackByFn: TrackByFunction<VDev> = (_, vdev) => vdev.guid;
  readonly hasNestedChild = (_: number, device: VDev): boolean => Boolean(device.children?.length);
  readonly isDeviceGroup = (_: number, device: VDev): boolean => !device.type;

  constructor(
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private loader: AppLoaderService, // TODO: Replace with a better approach
    private route: ActivatedRoute,
  ) { }

  ngOnInit(): void {
    this.loader.open();
    const poolId = this.route.snapshot.paramMap.get('poolId');
    this.ws.call('pool.query', [[['id', '=', Number(poolId)]]]).pipe(untilDestroyed(this)).subscribe(
      (pools) => {
        this.topology = pools[0].topology;
        const tolopogyEntries = Array.from(Object.entries(this.topology))
          .filter(([, value]) => value.length)
          .map(([key, value]) => ({
            guid: key,
            children: value,
          } as VDev));

        this.treeControl.dataNodes = tolopogyEntries;
        this.createDataSource(tolopogyEntries);
        this.selectFirstNode();
        this.loader.close();
        this.cdr.markForCheck();
      },
    );
  }

  private createDataSource(devices: VDev[]): void {
    this.dataSource = new IxNestedTreeDataSource(devices);
    this.dataSource.filterPredicate = (devices, query = '') => {
      return devices.map((rootDevice) => {
        return findInTree([rootDevice], (device) => {
          switch (device.type) {
            case VDevType.Disk:
              return device.disk.toLowerCase().includes(query.toLowerCase());
            case VDevType.Mirror:
              return device.guid.toLowerCase().includes(query.toLowerCase());
          }
        });
      }).filter(Boolean);
    };
  }

  private selectFirstNode(): void {
    if (!this.treeControl?.dataNodes?.length) {
      return;
    }

    const group = this.treeControl.dataNodes[0];
    this.treeControl.expand(group);
    if (group.children.length) {
      this.treeControl.expand(group.children[0]);
      this.selectedDevice = group.children[0];
    }
  }

  onDeviceSelected(device: VDev, event: MouseEvent): void {
    event.stopPropagation();
    this.selectedDevice = device;
  }

  onSearch(query: string): void {
    this.dataSource.filter(query);
  }
}
