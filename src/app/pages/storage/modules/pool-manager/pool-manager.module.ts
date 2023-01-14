import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatStepperModule } from '@angular/material/stepper';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AppCommonModule } from 'app/modules/common/app-common.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { TreeModule } from 'app/modules/ix-tree/tree.module';
import { ConfigurationPreviewComponent } from 'app/pages/storage/modules/pool-manager/components/configuration-preview/configuration-preview.component';
import { DiskIconComponent } from 'app/pages/storage/modules/pool-manager/components/disk-icon/disk-icon.component';
import { DiskInfoComponent } from 'app/pages/storage/modules/pool-manager/components/disk-info/disk-info.component';
import { InventoryComponent } from 'app/pages/storage/modules/pool-manager/components/inventory/inventory.component';
import { ManualDiskSelectionComponent } from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/manual-disk-selection.component';
import { ManualSelectionVdevComponent } from 'app/pages/storage/modules/pool-manager/components/manual-selection-vdev/manual-selection-vdev.component';
import { PoolManagerWizardComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/pool-manager-wizard.component';
import { CreateDataWizardStepComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/create-data-wizard-step/create-data-wizard-step.component';
import { GeneralWizardStepComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/general-wizard-step/general-wizard-step.component';
import { PoolManagerComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager/pool-manager.component';
import { VdevWrapperComponent } from 'app/pages/storage/modules/pool-manager/components/vdev-wrapper/vdev-wrapper.component';
import { routes } from 'app/pages/storage/modules/pool-manager/pool-manager.routing';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pools-manager-store.service';

@NgModule({
  imports: [
    AppCommonModule,
    IxFormsModule,
    IxIconModule,
    MatButtonModule,
    MatCardModule,
    CommonModule,
    MatDialogModule,
    MatStepperModule,
    MatDividerModule,
    TreeModule,
    IxIconModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    TranslateModule,
    CommonModule,
  ],
  declarations: [
    PoolManagerComponent,
    ConfigurationPreviewComponent,
    InventoryComponent,
    PoolManagerWizardComponent,
    DiskIconComponent,
    VdevWrapperComponent,
    DiskInfoComponent,
    ManualSelectionVdevComponent,
    GeneralWizardStepComponent,
    CreateDataWizardStepComponent,
    ManualDiskSelectionComponent,
  ],
  providers: [
    PoolManagerStore,
  ],
})

export class PoolManagerModule {
}
