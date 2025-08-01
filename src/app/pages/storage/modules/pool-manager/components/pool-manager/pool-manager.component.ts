import { ChangeDetectionStrategy, Component, signal, ViewChild, inject } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Observable, of } from 'rxjs';
import { UnsavedChangesService } from 'app/modules/unsaved-changes/unsaved-changes.service';
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
  private unsavedChangesService = inject(UnsavedChangesService);

  @ViewChild('poolManagerWizard') poolManagerWizard: PoolManagerWizardComponent;

  protected hasConfigurationPreview = true;
  protected isFormDirty = signal(false);

  onStepChanged(step: PoolCreationWizardStep): void {
    this.hasConfigurationPreview = step !== PoolCreationWizardStep.Review;
  }

  canDeactivate(): Observable<boolean> {
    return this.poolManagerWizard.isFormDirty ? this.unsavedChangesService.showConfirmDialog() : of(true);
  }
}
