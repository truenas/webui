import { CdkStepper } from '@angular/cdk/stepper';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import {
  byTextContent, createComponentFactory, mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import { BehaviorSubject, of } from 'rxjs';
import { GiB } from 'app/constants/bytes.constant';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DiskType } from 'app/enums/disk-type.enum';
import { CreateVdevLayout, VdevType } from 'app/enums/v-dev-type.enum';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import {
  InspectVdevsDialogComponent,
} from 'app/pages/storage/modules/pool-manager/components/inspect-vdevs-dialog/inspect-vdevs-dialog.component';
import { DispersalStrategy } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/2-enclosure-wizard-step/enclosure-wizard-step.component';
import {
  ReviewWizardStepComponent,
} from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/9-review-wizard-step/review-wizard-step.component';
import { PoolCreationSeverity } from 'app/pages/storage/modules/pool-manager/enums/pool-creation-severity';
import { PoolCreationWizardStep } from 'app/pages/storage/modules/pool-manager/enums/pool-creation-wizard-step.enum';
import {
  TopologyCategoryDescriptionPipe,
} from 'app/pages/storage/modules/pool-manager/pipes/topology-category-description.pipe';
import { PoolManagerValidationService } from 'app/pages/storage/modules/pool-manager/store/pool-manager-validation.service';
import {
  PoolManagerState,
  PoolManagerStore,
} from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

describe('ReviewWizardStepComponent', () => {
  let spectator: Spectator<ReviewWizardStepComponent>;
  let loader: HarnessLoader;
  const state = {
    name: 'test-pool',
    encryption: 'SHA95',
    topology: {
      [VdevType.Data]: {
        diskSize: 2 * GiB,
        vdevsNumber: 2,
        layout: CreateVdevLayout.Stripe,
        width: 3,
        diskType: DiskType.Hdd,
        vdevs: [[{ }], [{ }]],
      },
      [VdevType.Log]: {
        vdevs: [{}],
        hasCustomDiskSelection: true,
      },
    },
    enclosures: [
      {
        name: 'ENC 1',
        id: 'id1',
      },
    ],
    enclosureSettings: {
      limitToSingleEnclosure: null,
    },
  } as PoolManagerState;
  const state$ = new BehaviorSubject(state);

  const createComponent = createComponentFactory({
    component: ReviewWizardStepComponent,
    imports: [
      FileSizePipe,
      MapValuePipe,
      TopologyCategoryDescriptionPipe,
    ],
    providers: [
      mockProvider(CdkStepper),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(PoolManagerValidationService, {
        getPoolCreationErrors: jest.fn(() => of([])),
      }),
      mockProvider(PoolManagerStore, {
        state$,
        totalUsableCapacity$: of(2 * GiB),
      }),
      mockProvider(MatDialog),
      mockAuth(),
    ],
  });

  function getSummaryItem(name: string): string {
    return spectator.query(byTextContent(name, { selector: '.summary-item .label' })).nextSibling.textContent.trim();
  }

  describe('buttons', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('emits (createPool) when Create Pool is pressed', async () => {
      jest.spyOn(spectator.component.createPool, 'emit');
      const createPool = await loader.getHarness(MatButtonHarness.with({ text: 'Create Pool' }));
      await createPool.click();

      expect(spectator.component.createPool.emit).toHaveBeenCalled();
    });

    it('opens an Inspect Vdevs dialog when corresponding button is pressed', async () => {
      const inspectButton = await loader.getHarness(MatButtonHarness.with({ text: 'Inspect VDEVs' }));
      await inspectButton.click();

      expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(InspectVdevsDialogComponent, {
        data: {
          topology: state.topology,
          enclosures: state.enclosures,
        },
        panelClass: 'inspect-vdevs-dialog',
      });
    });
  });

  describe('summary', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('shows pool name', () => {
      expect(getSummaryItem('Pool Name')).toBe('test-pool');
    });

    it('shows encryption', () => {
      expect(getSummaryItem('Encryption')).toBe('SHA95');
    });

    it('shows vdev summary', () => {
      expect(spectator.queryAll('.topology-summary .summary-item')).toHaveLength(2);
      expect(getSummaryItem('Data')).toBe('2 × STRIPE | 3 × 2 GiB (HDD)');
      expect(getSummaryItem('Log')).toBe('Manual layout | 1 VDEVs');
    });

    it('shows total capacity', () => {
      expect(getSummaryItem('Est. Usable Raw Capacity')).toBe('2 GiB');
    });

    it('says Maximize Dispersal when this dispersal strategy is used', () => {
      state$.next({
        ...state,
        enclosureSettings: {
          maximizeEnclosureDispersal: true,
          limitToSingleEnclosure: null,
          dispersalStrategy: DispersalStrategy.Maximize,
        },
      });
      spectator.detectChanges();

      expect(getSummaryItem('Dispersal Strategy')).toBe('Maximize Dispersal');
    });

    it('shows if Limit To Enclosure option is used', () => {
      state$.next({
        ...state,
        enclosureSettings: {
          maximizeEnclosureDispersal: false,
          limitToSingleEnclosure: 'id1',
          dispersalStrategy: DispersalStrategy.LimitToSingle,
        },
      });
      spectator.detectChanges();

      expect(getSummaryItem('Dispersal Strategy')).toBe('Limit To ENC 1 Enclosure');
    });

    it('handles start over logic', async () => {
      const startOver = await loader.getHarness(MatButtonHarness.with({ text: 'Start Over' }));
      await startOver.click();

      expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Start Over',
      }));

      const store = spectator.inject(PoolManagerStore);
      expect(store.startOver).toHaveBeenCalled();
    });
  });

  describe('validation', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          mockProvider(PoolManagerStore, {
            state$,
            totalUsableCapacity$: of(2 * GiB),
          }),
          mockProvider(PoolManagerValidationService, {
            getPoolCreationErrors: jest.fn(() => of([
              {
                text: 'Some error #1',
                severity: PoolCreationSeverity.Error,
                step: PoolCreationWizardStep.General,
              },
              {
                text: 'Some warning #1',
                severity: PoolCreationSeverity.Warning,
                step: PoolCreationWizardStep.General,
              },
            ])),
          }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('shows list of validation errors from store', () => {
      const errorItem = spectator.query('.error.summary-item');
      expect(errorItem).toBeTruthy();
      expect(errorItem.innerHTML).toBe(' Some error #1 ');

      const warningItem = spectator.query('.warning.summary-item');
      expect(warningItem).toBeTruthy();
      expect(warningItem.innerHTML).toBe(' Some warning #1 ');
    });

    it('disables pool creation button once there are errors', async () => {
      const createPool = await loader.getHarness(MatButtonHarness.with({ text: 'Create Pool' }));
      expect(createPool.isDisabled).toBeTruthy();
    });
  });
});
