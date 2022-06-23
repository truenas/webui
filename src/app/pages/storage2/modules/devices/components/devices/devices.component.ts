import { NestedTreeControl } from '@angular/cdk/tree';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, TrackByFunction,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { VDevType } from 'app/enums/v-dev-type.enum';
import { PoolTopology } from 'app/interfaces/pool.interface';
import { VDev } from 'app/interfaces/storage.interface';
import { IxNestedTreeDataSource } from 'app/modules/ix-tree/ix-tree-nested-datasource';
import { AppLoaderService, WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  templateUrl: './devices.component.html',
  styleUrls: ['./devices.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DevicesComponent implements OnInit {
  topology: PoolTopology;
  selectedItem: VDev;
  dataSource: IxNestedTreeDataSource<VDev>;
  treeControl = new NestedTreeControl<VDev, string>((vdev) => vdev.children, {
    trackBy: (vdev) => vdev.guid,
  });
  readonly trackByFn: TrackByFunction<VDev> = (_, vdev) => vdev.guid;
  readonly hasNestedChild = (_: number, vdev: VDev): boolean => Boolean(vdev.children?.length);

  constructor(
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private loader: AppLoaderService, // TODO: Replace with a better approach
    private route: ActivatedRoute,
  ) { }

  get isDiskSelected(): boolean {
    return this.selectedItem.type === VDevType.Disk;
  }

  ngOnInit(): void {
    this.loader.open();
    const poolId = this.route.snapshot.paramMap.get('poolId');
    this.ws.call('pool.query', [[['id', '=', Number(poolId)]]]).pipe(untilDestroyed(this)).subscribe(
      (pools) => {
        this.topology = pools[0].topology;
        this.dataSource = new IxNestedTreeDataSource(this.topology.data);
        this.loader.close();
        this.cdr.markForCheck();
      },
    );
  }

  onRowSelected(vdev: VDev, event: MouseEvent): void {
    event.stopPropagation();
    this.selectedItem = vdev;
  }

  onSearch(query: string): void {
    console.info('onSearch', query);
  }
}
