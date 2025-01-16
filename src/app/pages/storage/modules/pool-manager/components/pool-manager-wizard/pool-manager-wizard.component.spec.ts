import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatDialog } from '@angular/material/dialog';
import { MatStepperModule } from '@angular/material/stepper';
import { MatStepperHarness } from '@angular/material/stepper/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponents } from 'ng-mocks';
import { BehaviorSubject, Subject, of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockCall, mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { CreateVdevLayout, VdevType } from 'app/enums/v-dev-type.enum';
import { Pool } from 'app/interfaces/pool.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { AddVdevsStore } from 'app/pages/storage/modules/pool-manager/components/add-vdevs/store/add-vdevs-store.service';
import {
  DownloadKeyDialogComponent,
} from 'app/pages/storage/modules/pool-manager/components/download-key-dialog/download-key-dialog.component';
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
import { PoolManagerValidationService } from 'app/pages/storage/modules/pool-manager/store/pool-manager-validation.service';
import { PoolManagerState, PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { selectHasEnclosureSupport } from 'app/store/system-info/system-info.selectors';

describe('PoolManagerWizardComponent', () => {
  let spectator: Spectator<PoolManagerWizardComponent>;
  let loader: HarnessLoader;
  let wizard: MatStepperHarness;
  let store: PoolManagerStore;

  const startOver$ = new Subject<void>();

  const hasMultipleEnclosuresInAllowedDisks$ = new BehaviorSubject(false);
  const state = {
    name: 'pewl',
    encryption: undefined,
    diskSettings: {
      allowNonUniqueSerialDisks: true,
    },
    topology: {
      [VdevType.Data]: {
        layout: CreateVdevLayout.Mirror,
        vdevs: [
          [{ devname: 'ada1' }, { devname: 'ada2' }],
          [{ devname: 'ada3' }, { devname: 'ada4' }],
        ],
      },
      [VdevType.Log]: {
        layout: CreateVdevLayout.Stripe,
        vdevs: [
          [{ devname: 'sda1' }],
          [{ devname: 'sda2' }],
        ],
      },
      [VdevType.Spare]: {
        vdevs: [
          [{ devname: 'sda3' }, { devname: 'sda4' }],
          [{ devname: 'sda5' }, { devname: 'sda6' }],
        ],
      },
    },
  } as PoolManagerState;
  const state$ = new BehaviorSubject(state);
  const createdPool = {} as Pool;

  const createComponent = createComponentFactory({
    component: PoolManagerWizardComponent,
    imports: [
      MatStepperModule,
      FakeProgressBarComponent,
      MockComponents(
        GeneralWizardStepComponent,
        EnclosureWizardStepComponent,
        DataWizardStepComponent,
        LogWizardStepComponent,
        SpareWizardStepComponent,
        CacheWizardStepComponent,
        MetadataWizardStepComponent,
        DedupWizardStepComponent,
        ReviewWizardStepComponent,
      ),
    ],
    componentProviders: [
      mockProvider(PoolManagerStore, {
        initialize: jest.fn(),
        hasMultipleEnclosuresAfterFirstStep$: hasMultipleEnclosuresInAllowedDisks$.asObservable(),
        state$: state$.asObservable(),
        startOver$,
        isLoading$: of(false),
      }),
      mockApi([
        mockCall('pool.query', []),
        mockJob('pool.create', fakeSuccessfulJob(createdPool)),
      ]),
      mockProvider(ActivatedRoute, {
        params: of({}),
        snapshot: { url: '' },
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
        jobDialog: jest.fn(() => ({
          afterClosed: () => of(fakeSuccessfulJob(createdPool)),
        })),
      }),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(undefined),
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
      mockProvider(AddVdevsStore, {
        pool$: of(null),
        isLoading$: of(false),
      }),
      mockProvider(Router),
      mockProvider(SnackbarService),
      mockProvider(PoolManagerValidationService, {
        getTopLevelWarningsForEachStep: jest.fn(() => of({})),
        getTopLevelErrorsForEachStep: jest.fn(() => of({})),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    wizard = await loader.getHarness(MatStepperHarness);
    store = spectator.inject(PoolManagerStore, true);
  });

  it('initializes pool manager store on init', () => {
    expect(store.initialize).toHaveBeenCalled();
  });

  it('always shows steps: General, Data, Log, Spare, Cache, Metadata, Review', async () => {
    const steps = await wizard.getSteps();
    const stepLabels = await Promise.all(steps.map((step) => step.getLabel()));
    expect(stepLabels).toEqual([
      'General Info',
      'Data',
      'Log (Optional)',
      'Spare (Optional)',
      'Cache (Optional)',
      'Metadata (Optional)',
      'Dedup (Optional)',
      'Review',
    ]);

    expect(spectator.query(GeneralWizardStepComponent)).toExist();
    expect(spectator.query(EnclosureWizardStepComponent)).not.toExist();
    expect(spectator.query(DataWizardStepComponent)).toExist();
    expect(spectator.query(LogWizardStepComponent)).toExist();
    expect(spectator.query(SpareWizardStepComponent)).toExist();
    expect(spectator.query(CacheWizardStepComponent)).toExist();
    expect(spectator.query(MetadataWizardStepComponent)).toExist();
    expect(spectator.query(DedupWizardStepComponent)).toExist();
  });

  it('shows an extra Enclosure Options step for enterprise systems with multiple enclosures', async () => {
    hasMultipleEnclosuresInAllowedDisks$.next(true);

    const steps = await wizard.getSteps();
    const stepLabels = await Promise.all(steps.map((step) => step.getLabel()));
    expect(stepLabels).toEqual([
      'General Info',
      'Enclosure Options',
      'Data',
      'Log (Optional)',
      'Spare (Optional)',
      'Cache (Optional)',
      'Metadata (Optional)',
      'Dedup (Optional)',
      'Review',
    ]);
    expect(spectator.query(EnclosureWizardStepComponent)).toExist();
  });

  describe('creating a pool', () => {
    it('creates a pool using store topology last step emits createPool event', async () => {
      await wizard.selectStep({ label: 'Review' });

      spectator.query(ReviewWizardStepComponent).createPool.emit();

      expect(spectator.inject(DialogService, true).jobDialog).toHaveBeenCalled();
      expect(spectator.inject(ApiService, true).job).toHaveBeenCalledWith('pool.create', [{
        name: 'pewl',
        allow_duplicate_serials: true,
        encryption: false,
        topology: {
          data: [
            {
              disks: ['ada1', 'ada2'],
              type: CreateVdevLayout.Mirror,
            },
            {
              disks: ['ada3', 'ada4'],
              type: CreateVdevLayout.Mirror,
            },
          ],
          log: [
            { disks: ['sda1'], type: CreateVdevLayout.Stripe },
            { disks: ['sda2'], type: CreateVdevLayout.Stripe },
          ],
          spares: ['sda3', 'sda4', 'sda5', 'sda6'],
        },
      }]);
      expect(spectator.inject(SnackbarService, true).success).toHaveBeenCalled();
      expect(spectator.inject(Router, true).navigate).toHaveBeenCalledWith(['/storage']);
    });

    it('shows a DownloadKeyDialog after pool has been created if encryption was used', async () => {
      state$.next({
        ...state,
        encryption: 'AES-256-GCM',
      });

      await wizard.selectStep({ label: 'Review' });
      spectator.query(ReviewWizardStepComponent)!.createPool.emit();

      expect(spectator.inject(MatDialog, true).open).toHaveBeenCalledWith(DownloadKeyDialogComponent, {
        disableClose: true,
        data: createdPool,
      });
    });
  });
});
