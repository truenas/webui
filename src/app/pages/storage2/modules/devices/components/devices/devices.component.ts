import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { untilDestroyed } from '@ngneat/until-destroy';
import { PoolTopology } from 'app/interfaces/pool.interface';
import { VDev } from 'app/interfaces/storage.interface';
import { AppLoaderService, WebSocketService } from 'app/services';

@Component({
  templateUrl: './devices.component.html',
  styleUrls: ['./devices.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DevicesComponent implements OnInit {
  topology: PoolTopology;
  selectedItem: VDev;

  constructor(
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private loader: AppLoaderService, // TODO: Replace with a better approach
    private route: ActivatedRoute,
  ) { }

  ngOnInit(): void {
    this.loader.open();
    const poolId = this.route.snapshot.paramMap.get('poolId');
    this.ws.call('pool.query', [[['id', '=', poolId]]]).pipe(untilDestroyed(this)).subscribe(
      (pools) => {
        this.topology = pools[0].topology;
        this.loader.close();
        this.cdr.markForCheck();
      },
    );
  }

  onRowSelected(vdev: VDev): void {
    this.selectedItem = vdev;
  }
}
