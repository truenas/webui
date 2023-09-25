import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DndModule } from 'ngx-drag-drop';
import { NgxFilesizeModule } from 'ngx-filesize';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { CoreComponents } from 'app/core/core-components.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { CastModule } from 'app/modules/cast/cast.module';
import { AppCommonModule } from 'app/modules/common/app-common.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { TreeModule } from 'app/modules/ix-tree/tree.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { AddVdevsComponent } from 'app/pages/storage/modules/pool-manager/components/add-vdevs/add-vdevs.component';
import { AddVdevsStore } from 'app/pages/storage/modules/pool-manager/components/add-vdevs/store/add-vdevs-store.service';
import { ConfigurationPreviewComponent } from 'app/pages/storage/modules/pool-manager/components/configuration-preview/configuration-preview.component';
import { ExistingConfigurationPreviewComponent } from 'app/pages/storage/modules/pool-manager/components/existing-configuration-preview/existing-configuration-preview.component';
import { InventoryComponent } from 'app/pages/storage/modules/pool-manager/components/inventory/inventory.component';
import { DiskIconComponent } from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/components/disk-icon/disk-icon.component';
import { DiskInfoComponent } from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/components/disk-info/disk-info.component';
import { EnclosureWrapperComponent } from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/components/enclosure-wrapper/enclosure-wrapper.component';
import { ManualSelectionVdevComponent } from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/components/manual-selection-vdev/manual-selection-vdev.component';
import { ManualDiskSelectionComponent } from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/manual-disk-selection.component';
import { ManualDiskDragToggleStore } from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/store/manual-disk-drag-toggle.store';
import { ManualDiskSelectionStore } from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/store/manual-disk-selection.store';
import { NewDevicesPreviewComponent } from 'app/pages/storage/modules/pool-manager/components/new-devices/new-devices-preview.component';
import { PoolManagerComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager/pool-manager.component';
import { DiskSizeSelectsComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/components/layout-step/automated-disk-selection/disk-size-selects/disk-size-selects.component';
import { PoolManagerWizardComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/pool-manager-wizard.component';
import { GeneralWizardStepComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/1-general-wizard-step/general-wizard-step.component';
import { LogWizardStepComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/4-log-wizard-step/log-wizard-step.component';
import { SpareWizardStepComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/5-spare-wizard-step/spare-wizard-step.component';
import { CacheWizardStepComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/6-cache-wizard-step/cache-wizard-step.component';
import { MetadataWizardStepComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/7-metadata-wizard-step/metadata-wizard-step.component';
import { DedupWizardStepComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/8-dedup-wizard-step/dedup-wizard-step.component';
import { ReviewWizardStepComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/9-review-wizard-step/review-wizard-step.component';
import {
  TopologyCategoryDescriptionPipe,
} from 'app/pages/storage/modules/pool-manager/pipes/topology-category-description.pipe';
import { routes } from 'app/pages/storage/modules/pool-manager/pool-manager.routing';
import { PoolManagerValidationService } from 'app/pages/storage/modules/pool-manager/store/pool-manager-validation.service';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { GenerateVdevsService } from 'app/pages/storage/modules/pool-manager/utils/generate-vdevs/generate-vdevs.service';
import { DownloadKeyDialogComponent } from './components/download-key-dialog/download-key-dialog.component';
import { InspectVdevsDialogComponent } from './components/inspect-vdevs-dialog/inspect-vdevs-dialog.component';
import { ManualSelectionDiskFiltersComponent } from './components/manual-disk-selection/components/manual-selection-disks/manual-selection-disk-filters/manual-selection-disk-filters.component';
import { ManualSelectionDisksComponent } from './components/manual-disk-selection/components/manual-selection-disks/manual-selection-disks.component';
import { AutomatedDiskSelectionComponent } from './components/pool-manager-wizard/components/layout-step/automated-disk-selection/automated-disk-selection.component';
import { DraidSelectionComponent } from './components/pool-manager-wizard/components/layout-step/automated-disk-selection/draid-selection/draid-selection.component';
import { NormalSelectionComponent } from './components/pool-manager-wizard/components/layout-step/automated-disk-selection/normal-selection/normal-selection.component';
import { CustomLayoutAppliedComponent } from './components/pool-manager-wizard/components/layout-step/custom-layout-applied/custom-layout-applied.component';
import { LayoutStepComponent } from './components/pool-manager-wizard/components/layout-step/layout-step.component';
import { PoolWarningsComponent } from './components/pool-manager-wizard/components/pool-warnings/pool-warnings.component';
import { EnclosureWizardStepComponent } from './components/pool-manager-wizard/steps/2-enclosure-wizard-step/enclosure-wizard-step.component';
import { DataWizardStepComponent } from './components/pool-manager-wizard/steps/3-data-wizard-step/data-wizard-step.component';

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
    CoreComponents,
    NgxSkeletonLoaderModule,
    MatCheckboxModule,
    MatListModule,
    CommonDirectivesModule,
    MatTooltipModule,
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
    SpareWizardStepComponent,
    NewDevicesPreviewComponent,
    ReviewWizardStepComponent,
    GeneralWizardStepComponent,
    CacheWizardStepComponent,
    ManualDiskSelectionComponent,
    DedupWizardStepComponent,
    ExistingConfigurationPreviewComponent,
    MetadataWizardStepComponent,
    AddVdevsComponent,
    ManualSelectionDisksComponent,
    ManualSelectionDiskFiltersComponent,
    LayoutStepComponent,
    LogWizardStepComponent,
    AutomatedDiskSelectionComponent,
    CustomLayoutAppliedComponent,
    EnclosureWizardStepComponent,
    DataWizardStepComponent,
    PoolWarningsComponent,
    DownloadKeyDialogComponent,
    InspectVdevsDialogComponent,
    TopologyCategoryDescriptionPipe,
    DiskSizeSelectsComponent,
    DraidSelectionComponent,
    NormalSelectionComponent,
  ],
  providers: [
    PoolManagerStore,
    AddVdevsStore,
    ManualDiskSelectionStore,
    ManualDiskDragToggleStore,
    GenerateVdevsService,
    PoolManagerValidationService,
    {
      provide: STEPPER_GLOBAL_OPTIONS,
      useValue: { showError: true },
    },
  ],
})

export class PoolManagerModule {
}
