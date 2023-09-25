import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { combineLatest, filter, tap } from 'rxjs';
import { Pool } from 'app/interfaces/pool.interface';
import { Disk } from 'app/interfaces/storage.interface';
import { AddVdevsStore } from 'app/pages/storage/modules/pool-manager/components/add-vdevs/store/add-vdevs-store.service';
import { PoolCreationWizardStep } from 'app/pages/storage/modules/pool-manager/enums/pool-creation-wizard-step.enum';
import { PoolManagerTopology } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { poolTopologyToStoreTopology } from 'app/pages/storage/modules/pool-manager/utils/topology.utils';

@UntilDestroy()
@Component({
  templateUrl: './add-vdevs.component.html',
  styleUrls: ['./add-vdevs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddVdevsComponent implements OnInit {
  protected hasConfigurationPreview = true;
  protected existingPool: Pool = null;
  protected poolDisks: Disk[] = [];
  protected topology: PoolManagerTopology = null;

  constructor(
    private addVdevsStore: AddVdevsStore,
    private activatedRoute: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.addVdevsStore.initialize();
    this.activatedRoute.params.pipe(
      tap((params) => {
        this.addVdevsStore.loadPoolData(+params.poolId);
      }),
      untilDestroyed(this),
    ).subscribe();
    combineLatest([
      this.addVdevsStore.pool$.pipe(filter(Boolean)),
      this.addVdevsStore.poolDisks$.pipe(filter((disks) => !!disks.length)),
    ]).pipe(untilDestroyed(this)).subscribe({
      next: ([pool, poolDisks]) => {
        this.existingPool = pool;
        this.poolDisks = poolDisks;
        this.topology = poolTopologyToStoreTopology(pool.topology, poolDisks);
        this.cdr.markForCheck();
      },
    });
  }

  onStepChanged(step: PoolCreationWizardStep): void {
    this.hasConfigurationPreview = step !== PoolCreationWizardStep.Review;
  }
}
