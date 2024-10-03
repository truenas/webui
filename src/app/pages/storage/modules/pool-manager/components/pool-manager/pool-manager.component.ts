import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import {
  AddVdevsStore,
} from 'app/pages/storage/modules/pool-manager/components/add-vdevs/store/add-vdevs-store.service';
import { ConfigurationPreviewComponent } from 'app/pages/storage/modules/pool-manager/components/configuration-preview/configuration-preview.component';
import { InventoryComponent } from 'app/pages/storage/modules/pool-manager/components/inventory/inventory.component';
import { PoolManagerWizardComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/pool-manager-wizard.component';
import { PoolCreationWizardStep } from 'app/pages/storage/modules/pool-manager/enums/pool-creation-wizard-step.enum';
import { DiskStore } from 'app/pages/storage/modules/pool-manager/store/disk.store';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import {
  GenerateVdevsService,
} from 'app/pages/storage/modules/pool-manager/utils/generate-vdevs/generate-vdevs.service';

@UntilDestroy()
@Component({
  selector: 'ix-pool-manager',
  templateUrl: './pool-manager.component.html',
  styleUrls: ['./pool-manager.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    PoolManagerWizardComponent,
    ConfigurationPreviewComponent,
    InventoryComponent,
  ],
  providers: [
    DiskStore,
    PoolManagerStore,
    AddVdevsStore,
    GenerateVdevsService,
  ],
})
export class PoolManagerComponent {
  protected hasConfigurationPreview = true;

  onStepChanged(step: PoolCreationWizardStep): void {
    this.hasConfigurationPreview = step !== PoolCreationWizardStep.Review;
  }
}
