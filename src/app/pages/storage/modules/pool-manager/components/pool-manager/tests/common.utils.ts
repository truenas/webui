import { ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatStepperModule } from '@angular/material/stepper';
import { mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { Job } from 'app/interfaces/job.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { WarningComponent } from 'app/modules/forms/ix-forms/components/warning/warning.component';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { CastPipe } from 'app/modules/pipes/cast/cast.pipe';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import {
  AddVdevsStore,
} from 'app/pages/storage/modules/pool-manager/components/add-vdevs/store/add-vdevs-store.service';
import {
  ConfigurationPreviewComponent,
} from 'app/pages/storage/modules/pool-manager/components/configuration-preview/configuration-preview.component';
import {
  ExistingConfigurationPreviewComponent,
} from 'app/pages/storage/modules/pool-manager/components/existing-configuration-preview/existing-configuration-preview.component';
import {
  InspectVdevsDialogComponent,
} from 'app/pages/storage/modules/pool-manager/components/inspect-vdevs-dialog/inspect-vdevs-dialog.component';
import { InventoryComponent } from 'app/pages/storage/modules/pool-manager/components/inventory/inventory.component';
import {
  ManualDiskSelectionComponent,
} from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/manual-disk-selection.component';
import { NewDevicesPreviewComponent } from 'app/pages/storage/modules/pool-manager/components/new-devices/new-devices-preview.component';
import {
  AutomatedDiskSelectionComponent,
} from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/components/layout-step/automated-disk-selection/automated-disk-selection.component';
import {
  DiskSizeSelectsComponent,
} from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/components/layout-step/automated-disk-selection/disk-size-selects/disk-size-selects.component';
import {
  DraidSelectionComponent,
} from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/components/layout-step/automated-disk-selection/draid-selection/draid-selection.component';
import {
  NormalSelectionComponent,
} from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/components/layout-step/automated-disk-selection/normal-selection/normal-selection.component';
import {
  LayoutStepComponent,
} from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/components/layout-step/layout-step.component';
import {
  PoolWarningsComponent,
} from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/components/pool-warnings/pool-warnings.component';
import {
  PoolManagerWizardComponent,
} from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/pool-manager-wizard.component';
import {
  GeneralWizardStepComponent,
} from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/1-general-wizard-step/general-wizard-step.component';
import {
  EnclosureWizardStepComponent,
} from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/2-enclosure-wizard-step/enclosure-wizard-step.component';
import {
  DataWizardStepComponent,
} from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/3-data-wizard-step/data-wizard-step.component';
import {
  LogWizardStepComponent,
} from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/4-log-wizard-step/log-wizard-step.component';
import {
  SpareWizardStepComponent,
} from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/5-spare-wizard-step/spare-wizard-step.component';
import {
  CacheWizardStepComponent,
} from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/6-cache-wizard-step/cache-wizard-step.component';
import {
  MetadataWizardStepComponent,
} from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/7-metadata-wizard-step/metadata-wizard-step.component';
import {
  DedupWizardStepComponent,
} from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/8-dedup-wizard-step/dedup-wizard-step.component';
import {
  ReviewWizardStepComponent,
} from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/9-review-wizard-step/review-wizard-step.component';
import {
  TopologyCategoryDescriptionPipe,
} from 'app/pages/storage/modules/pool-manager/pipes/topology-category-description.pipe';
import { DiskStore } from 'app/pages/storage/modules/pool-manager/store/disk.store';
import {
  PoolManagerValidationService,
} from 'app/pages/storage/modules/pool-manager/store/pool-manager-validation.service';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import {
  GenerateVdevsService,
} from 'app/pages/storage/modules/pool-manager/utils/generate-vdevs/generate-vdevs.service';
import { selectHasEnclosureSupport } from 'app/store/system-info/system-info.selectors';

export const commonImports = [
  ReactiveFormsModule,
  MatStepperModule,
  FileSizePipe,
  MapValuePipe,
  CastPipe,
  WarningComponent,
  FakeProgressBarComponent,
  ConfigurationPreviewComponent,
  ExistingConfigurationPreviewComponent,
  InspectVdevsDialogComponent,
  InventoryComponent,
  ManualDiskSelectionComponent,
  PoolManagerWizardComponent,
  LayoutStepComponent,
  PoolWarningsComponent,
  GeneralWizardStepComponent,
  EnclosureWizardStepComponent,
  DataWizardStepComponent,
  LogWizardStepComponent,
  SpareWizardStepComponent,
  CacheWizardStepComponent,
  MetadataWizardStepComponent,
  DedupWizardStepComponent,
  ReviewWizardStepComponent,
  TopologyCategoryDescriptionPipe,
  AutomatedDiskSelectionComponent,
  NormalSelectionComponent,
  DraidSelectionComponent,
  DiskSizeSelectsComponent,
  NewDevicesPreviewComponent,
];

export const commonProviders = [
  AddVdevsStore,
  PoolManagerStore,
  GenerateVdevsService,
  PoolManagerValidationService,
  DiskStore,
  mockProvider(MatDialog, {
    open: jest.fn(() => ({
      afterClosed: () => of(undefined),
    })),
  }),
  mockProvider(DialogService, {
    confirm: jest.fn(() => of(true)),
    jobDialog: jest.fn(() => ({
      afterClosed: () => of({
        result: {},
      } as Job<Pool>),
    })),
  }),
  provideMockStore({
    selectors: [
      {
        selector: selectHasEnclosureSupport,
        value: true,
      },
    ],
  }),
];
