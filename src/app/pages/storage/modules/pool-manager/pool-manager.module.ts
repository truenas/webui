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
import { DndModule } from 'ngx-drag-drop';
import { NgxFilesizeModule } from 'ngx-filesize';
import { CastModule } from 'app/modules/cast/cast.module';
import { AppCommonModule } from 'app/modules/common/app-common.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { TreeModule } from 'app/modules/ix-tree/tree.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { ConfigurationPreviewComponent } from 'app/pages/storage/modules/pool-manager/components/configuration-preview/configuration-preview.component';
import { InventoryComponent } from 'app/pages/storage/modules/pool-manager/components/inventory/inventory.component';
import { DiskIconComponent } from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/disk-icon/disk-icon.component';
import { DiskInfoComponent } from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/disk-info/disk-info.component';
import { EnclosureWrapperComponent } from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/enclosure-wrapper/enclosure-wrapper.component';
import { ManualDiskSelectionComponent } from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/manual-disk-selection.component';
import { ManualSelectionVdevComponent } from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/manual-selection-vdev/manual-selection-vdev.component';
import { PoolManagerWizardComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/pool-manager-wizard.component';
import { CreateDataWizardStepComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/create-data-wizard-step/create-data-wizard-step.component';
import { GeneralWizardStepComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/general-wizard-step/general-wizard-step.component';
import { PoolManagerComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager/pool-manager.component';
import { routes } from 'app/pages/storage/modules/pool-manager/pool-manager.routing';
import { ManualDiskSelectionStore } from 'app/pages/storage/modules/pool-manager/store/manual-disk-selection-store.service';
import { OldPoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pools-manager-store.service';
import { ManualSelectionDiskFiltersComponent } from './components/manual-disk-selection/manual-selection-disks/manual-selection-disk-filters/manual-selection-disk-filters.component';
import { ManualSelectionDisksComponent } from './components/manual-disk-selection/manual-selection-disks/manual-selection-disks.component';

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
    DndModule,
    RouterModule.forChild(routes),
    TranslateModule,
    CommonModule,
    TestIdModule,
    NgxFilesizeModule,
    CastModule,
    AppLoaderModule,
  ],
  declarations: [
    PoolManagerComponent,
    ConfigurationPreviewComponent,
    InventoryComponent,
    PoolManagerWizardComponent,
    DiskIconComponent,
    EnclosureWrapperComponent,
    DiskInfoComponent,
    ManualSelectionVdevComponent,
    GeneralWizardStepComponent,
    CreateDataWizardStepComponent,
    ManualDiskSelectionComponent,
    ManualSelectionDisksComponent,
    ManualSelectionDiskFiltersComponent,
  ],
  providers: [
    OldPoolManagerStore,
    ManualDiskSelectionStore,
  ],
})

export class PoolManagerModule {
}
