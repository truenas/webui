import { MatIconRegistry } from '@angular/material/icon';
import { createSpyObject } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { EMPTY } from 'rxjs';
import { GiB } from 'app/constants/bytes.constant';
import { AdvancedConfig } from 'app/interfaces/advanced-config.interface';
import { IxIconRegistry } from 'app/modules/ix-icon/ix-icon.service';
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
import {
  PoolManagerValidationService,
} from 'app/pages/storage/modules/pool-manager/store/pool-manager-validation.service';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import {
  GenerateVdevsService,
} from 'app/pages/storage/modules/pool-manager/utils/generate-vdevs/generate-vdevs.service';
import { selectAdvancedConfig } from 'app/store/system-config/system-config.selectors';
import { selectSystemFeatures } from 'app/store/system-info/system-info.selectors';

export const commonDeclarations = [
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
  {
    provide: MatIconRegistry,
    useValue: createSpyObject(IxIconRegistry, {
      classNameForFontAlias: jest.fn(() => ''),
      getDefaultFontSetClass: jest.fn(() => []),
      getNamedSvgIcon: jest.fn(() => EMPTY),
    }),
  },
  provideMockStore({
    selectors: [
      {
        selector: selectAdvancedConfig,
        value: {
          swapondrive: 2 * GiB,
        } as AdvancedConfig,
      },
      {
        selector: selectSystemFeatures,
        value: {
          enclosure: true,
        },
      },
    ],
  }),
];
