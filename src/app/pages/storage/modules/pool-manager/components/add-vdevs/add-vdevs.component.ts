import {
  ChangeDetectionStrategy, Component, computed, DestroyRef, OnInit, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { tap } from 'rxjs';
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
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import {
  GenerateVdevsService,
} from 'app/pages/storage/modules/pool-manager/utils/generate-vdevs/generate-vdevs.service';

@Component({
  selector: 'ix-add-vdevs',
  templateUrl: './add-vdevs.component.html',
  styleUrls: ['./add-vdevs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  ],
})
export class AddVdevsComponent implements OnInit {
  private addVdevsStore = inject(AddVdevsStore);
  private activatedRoute = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  protected hasConfigurationPreview = true;
  protected poolDisks = this.addVdevsStore.poolDisks;
  // Shown once the pool's disks are known, so the preview never renders an empty disk list.
  protected existingPool = computed(() => (this.poolDisks().length ? this.addVdevsStore.pool() : null));

  ngOnInit(): void {
    this.addVdevsStore.initialize();
    this.activatedRoute.params.pipe(
      tap((params) => {
        this.addVdevsStore.loadPoolData(+params.poolId);
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
  }

  onStepChanged(step: PoolCreationWizardStep): void {
    this.hasConfigurationPreview = step !== PoolCreationWizardStep.Review;
  }
}
