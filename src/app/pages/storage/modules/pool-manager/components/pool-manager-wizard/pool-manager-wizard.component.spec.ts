import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatStepperModule } from '@angular/material/stepper';
import { MatStepperHarness } from '@angular/material/stepper/testing';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { BehaviorSubject, of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockEntityJobComponentRef } from 'app/core/testing/utils/mock-entity-job-component-ref.utils';
import { CreateVdevLayout, VdevType } from 'app/enums/v-dev-type.enum';
import { Pool } from 'app/interfaces/pool.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import {
  DownloadKeyDialogComponent,
} from 'app/pages/storage/modules/pool-manager/components/download-key-dialog/download-key-dialog.component';
import {
  ReviewStepComponent,
} from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/components/review-step/review-step.component';
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
import { PoolManagerState, PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { SystemGeneralService } from 'app/services';

describe('PoolManagerWizardComponent', () => {
  let spectator: Spectator<PoolManagerWizardComponent>;
  let loader: HarnessLoader;
  let wizard: MatStepperHarness;
  let store: PoolManagerStore;
  const hasMultipleEnclosures$ = new BehaviorSubject(false);
  const state = {
    name: 'pewl',
    encryption: undefined,
    diskOptions: {
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

  const createComponent = createComponentFactory({
    component: PoolManagerWizardComponent,
    imports: [
      MatStepperModule,
    ],
    declarations: [
      MockComponents(
        GeneralWizardStepComponent,
        EnclosureWizardStepComponent,
        DataWizardStepComponent,
        LogWizardStepComponent,
        ReviewStepComponent,
      ),
    ],
    providers: [
      mockProvider(PoolManagerStore, {
        initialize: jest.fn(),
        hasMultipleEnclosures$: hasMultipleEnclosures$.asObservable(),
        state$: state$.asObservable(),
      }),
      mockProvider(SystemGeneralService, {
        isEnterprise$: of(true),
      }),
      mockProvider(MatDialog, {
        open: jest.fn((component) => {
          if (component === DownloadKeyDialogComponent) {
            return { afterClosed: () => of(undefined) } as MatDialogRef<DownloadKeyDialogComponent>;
          }

          return {
            ...mockEntityJobComponentRef,
            componentInstance: {
              ...mockEntityJobComponentRef.componentInstance,
              success: of(fakeSuccessfulJob({ id: 2, name: 'pewl' } as Pool)),
            },
            afterClosed: () => of(undefined),
          };
        }),
      }),
      mockProvider(Router),
      mockProvider(SnackbarService),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    wizard = await loader.getHarness(MatStepperHarness);
    store = spectator.inject(PoolManagerStore);
  });

  it('initializes pool manager store on init', () => {
    expect(store.initialize).toHaveBeenCalled();
  });

  it('always shows steps: General, Data, Log, Spare, Cache, Metadata, Review', async () => {
    // TODO: Check for components once they are added.
    const steps = await wizard.getSteps();
    const stepLabels = await Promise.all(steps.map((step) => step.getLabel()));
    expect(stepLabels).toEqual([
      'General Info',
      'Data',
      'Log',
      'Spare',
      'Cache',
      'Metadata',
      'Review',
    ]);
  });

  it('shows an extra Enclosure Options step for enteprise systems with multiple enclosures', async () => {
    hasMultipleEnclosures$.next(true);

    const steps = await wizard.getSteps();
    const stepLabels = await Promise.all(steps.map((step) => step.getLabel()));
    expect(stepLabels).toEqual([
      'General Info',
      'Enclosure Options',
      'Data',
      'Log',
      'Spare',
      'Cache',
      'Metadata',
      'Review',
    ]);
  });

  describe('creating a pool', () => {
    it('creates a pool using store topology when Create Pool button is pressed on last step', async () => {
      const dialog = spectator.inject(MatDialog);
      await wizard.selectStep({ label: 'Review' });
      const createPoolButton = await loader.getHarness(MatButtonHarness.with({ text: 'Create Pool' }));
      await createPoolButton.click();

      expect(dialog.open).toHaveBeenCalledWith(EntityJobComponent, {
        disableClose: true,
        data: {
          title: 'Create Pool',
        },
      });

      expect(mockEntityJobComponentRef.componentInstance.setCall).toHaveBeenCalledWith('pool.create', [{
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
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
      expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/storage']);
    });

    it('shows a DownloadKeyDialog after pool has been created if encryption was used', async () => {
      state$.next({
        ...state,
        encryption: 'AES-256-GCM',
      });

      await wizard.selectStep({ label: 'Review' });
      const createPoolButton = await loader.getHarness(MatButtonHarness.with({ text: 'Create Pool' }));
      await createPoolButton.click();

      expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(DownloadKeyDialogComponent, {
        disableClose: true,
        data: {
          id: 2,
          name: 'pewl',
        },
      });
    });
  });
});
