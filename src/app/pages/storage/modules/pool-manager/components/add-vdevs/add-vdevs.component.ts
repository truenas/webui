import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { combineLatest, of, switchMap } from 'rxjs';
import { Pool } from 'app/interfaces/pool.interface';
import { Disk } from 'app/interfaces/storage.interface';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { poolTopologyToStoreTopology } from 'app/pages/storage/modules/pool-manager/utils/topology.utils';
import { WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  templateUrl: './add-vdevs.component.html',
  styleUrls: ['./add-vdevs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddVdevsComponent implements OnInit {
  pool: Pool;
  constructor(
    private route: ActivatedRoute,
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private poolManagerStore: PoolManagerStore,
  ) {}

  ngOnInit(): void {
    this.poolManagerStore.initialize();
    this.route.params.pipe(
      switchMap((params) => {
        return this.ws.call('pool.query', [[['id', '=', +params.poolId]]]);
      }),
      switchMap((pools) => combineLatest([
        of(pools),
        this.ws.call('disk.query', [[['pool', '=', pools[0].name]], { extra: { pools: true } }]),
      ])),
      untilDestroyed(this),
    ).subscribe({
      next: ([pools, disks]: [Pool[], Disk[]]) => {
        this.pool = pools[0];
        const topology = poolTopologyToStoreTopology(this.pool.topology, disks);
        this.poolManagerStore.patchState({
          topology: { ...topology },
        });
        this.cdr.markForCheck();
      },
    });
  }
}
