import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import {
  byTextContent, createComponentFactory, mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import { BehaviorSubject, of } from 'rxjs';
import { GiB } from 'app/constants/bytes.constant';
import { CoreComponents } from 'app/core/core-components.module';
import { DiskType } from 'app/enums/disk-type.enum';
import { CreateVdevLayout, VdevType } from 'app/enums/v-dev-type.enum';
import {
  InspectVdevsDialogComponent,
} from 'app/pages/storage/modules/pool-manager/components/inspect-vdevs-dialog/inspect-vdevs-dialog.component';
import {
  ReviewWizardStepComponent,
} from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/9-review-wizard-step/review-wizard-step.component';
import {
  TopologyCategoryDescriptionPipe,
} from 'app/pages/storage/modules/pool-manager/pipes/topology-category-description.pipe';
import {
  PoolManagerState,
  PoolManagerStore,
} from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { DialogService } from 'app/services';

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
        number: 1,
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
      CoreComponents,
    ],
    declarations: [
      TopologyCategoryDescriptionPipe,
    ],
    providers: [
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(PoolManagerStore, {
        state$,
        totalUsableCapacity$: of(2 * GiB),
      }),
      mockProvider(MatDialog),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  function getSummaryItem(name: string): string {
    return spectator.query(byTextContent(name, { selector: '.summary-item .label' })).nextSibling.textContent.trim();
  }

  describe('buttons', () => {
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
        data: state.topology,
        panelClass: 'inspect-vdevs-dialog',
      });
    });
  });

  describe('summary', () => {
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
      expect(getSummaryItem('Est. Usable Capacity')).toBe('2 GiB');
    });

    it('says Maximize Dispersal when this dispersal strategy is used', () => {
      state$.next({
        ...state,
        enclosureSettings: {
          maximizeEnclosureDispersal: true,
          limitToSingleEnclosure: null,
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
          limitToSingleEnclosure: 1,
        },
      });
      spectator.detectChanges();

      expect(getSummaryItem('Dispersal Strategy')).toBe('Limit To ENC 1 Enclosure');
    });

    it('handles start over logic', async () => {
      const startOver = await loader.getHarness(MatButtonHarness.with({ text: 'Start Over' }));
      await startOver.click();

      expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Start Over?',
      }));

      const store = spectator.inject(PoolManagerStore);
      expect(store.reset).toHaveBeenCalled();
    });
  });
});
