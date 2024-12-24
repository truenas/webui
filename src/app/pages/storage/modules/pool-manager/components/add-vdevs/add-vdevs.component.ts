import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { combineLatest, filter, tap } from 'rxjs';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { AddVdevsStore } from 'app/pages/storage/modules/pool-manager/components/add-vdevs/store/add-vdevs-store.service';
import { ExistingConfigurationPreviewComponent } from 'app/pages/storage/modules/pool-manager/components/existing-configuration-preview/existing-configuration-preview.component';
import { InventoryComponent } from 'app/pages/storage/modules/pool-manager/components/inventory/inventory.component';
import { NewDevicesPreviewComponent } from 'app/pages/storage/modules/pool-manager/components/new-devices/new-devices-preview.component';
import { PoolManagerWizardComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/pool-manager-wizard.component';
import { PoolCreationWizardStep } from 'app/pages/storage/modules/pool-manager/enums/pool-creation-wizard-step.enum';
import { DiskStore } from 'app/pages/storage/modules/pool-manager/store/disk.store';
import {
  PoolManagerValidationService,
} from 'app/pages/storage/modules/pool-manager/store/pool-manager-validation.service';
import { PoolManagerStore, PoolManagerTopology } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import {
  GenerateVdevsService,
} from 'app/pages/storage/modules/pool-manager/utils/generate-vdevs/generate-vdevs.service';
import { poolTopologyToStoreTopology } from 'app/pages/storage/modules/pool-manager/utils/topology.utils';

@UntilDestroy()
@Component({
  selector: 'ix-add-vdevs',
  templateUrl: './add-vdevs.component.html',
  styleUrls: ['./add-vdevs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    PoolManagerWizardComponent,
    ExistingConfigurationPreviewComponent,
    NewDevicesPreviewComponent,
    InventoryComponent,
  ],
  providers: [
    // TODO: Same as in pool-manager-wizard
    DiskStore,
    PoolManagerStore,
    AddVdevsStore,
    GenerateVdevsService,
    PoolManagerValidationService,
    {
      provide: STEPPER_GLOBAL_OPTIONS,
      useValue: { showError: true },
    },
  ],
})
export class AddVdevsComponent implements OnInit {
  protected hasConfigurationPreview = true;
  protected existingPool: Pool | null = null;
  protected poolDisks: DetailsDisk[] = [];
  protected topology: PoolManagerTopology | null = null;

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
