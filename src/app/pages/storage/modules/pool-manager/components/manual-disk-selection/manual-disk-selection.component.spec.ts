import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { UUID } from 'angular2-uuid';
import { MockComponents } from 'ng-mocks';
import { BehaviorSubject, of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { CreateVdevLayout } from 'app/enums/v-dev-type.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { Enclosure } from 'app/interfaces/enclosure.interface';
import {
  ManualSelectionDisksComponent,
} from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/components/manual-selection-disks/manual-selection-disks.component';
import {
  ManualSelectionVdevComponent,
} from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/components/manual-selection-vdev/manual-selection-vdev.component';
import {
  ManualSelectionVdev,
} from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/interfaces/manual-disk-selection.interface';
import {
  ManualDiskSelectionComponent,
  ManualDiskSelectionParams,
} from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/manual-disk-selection.component';
import {
  ManualDiskSelectionStore,
} from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/store/manual-disk-selection.store';
import {
  vdevsToManualSelectionVdevs,
} from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/utils/vdevs-to-manual-selection-vdevs.utils';

describe('ManualDiskSelectionComponent', () => {
  let spectator: Spectator<ManualDiskSelectionComponent>;
  let loader: HarnessLoader;
  const inventory = [] as DetailsDisk[];
  const incomingVdevs = [
    [{ devname: 'sda' }, { devname: 'sdb' }],
    [{ devname: 'sdc' }, { devname: 'sdd' }],
  ] as DetailsDisk[][];
  const enclosures = [] as Enclosure[];
  const storeVdevs$ = new BehaviorSubject<ManualSelectionVdev[]>(
    vdevsToManualSelectionVdevs(incomingVdevs),
  );

  const createComponent = createComponentFactory({
    component: ManualDiskSelectionComponent,
    declarations: [
      MockComponents(
        ManualSelectionDisksComponent,
        ManualSelectionVdevComponent,
      ),
    ],
    componentProviders: [
      mockAuth(),
      mockProvider(ManualDiskSelectionStore, {
        addVdev: jest.fn(),
        vdevs$: storeVdevs$.asObservable(),
        layout$: of(CreateVdevLayout.Stripe),
        initialize: jest.fn(),
      }),
      mockProvider(MatDialogRef),
    ],
  });

  describe('without vdevs limit', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          {
            provide: MAT_DIALOG_DATA,
            useValue: {
              inventory,
              enclosures,
              vdevs: incomingVdevs,
              layout: CreateVdevLayout.Stripe,
            } as ManualDiskSelectionParams,
          },
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('initializes store with vdevs coming from dialog data', () => {
      expect(spectator.inject(ManualDiskSelectionStore, true).initialize).toHaveBeenCalledWith({
        inventory,
        vdevs: incomingVdevs.map((vdev) => {
          return {
            disks: vdev.map((disk) => {
              return {
                ...disk,
                vdevUuid: expect.any(String),
                real_capacity: 0,
              };
            }),
            uuid: expect.any(String),
          };
        }),
        layout: CreateVdevLayout.Stripe,
      });
    });

    it('renders sidebar with disk inventory', () => {
      const selectionDisks = spectator.query(ManualSelectionDisksComponent)!;
      expect(selectionDisks.enclosures).toEqual(enclosures);
    });

    it('renders vdevs from store', () => {
      const vdevs = spectator.queryAll(ManualSelectionVdevComponent);
      expect(vdevs).toHaveLength(2);
      expect(vdevs[0].vdev).toEqual(storeVdevs$.value[0]);
      expect(vdevs[0].layout).toBe(CreateVdevLayout.Stripe);
      expect(vdevs[1].vdev).toEqual(storeVdevs$.value[1]);
      expect(vdevs[1].layout).toBe(CreateVdevLayout.Stripe);
    });

    it('adds a new vdev when Add button is clicked', async () => {
      const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
      await addButton.click();

      expect(spectator.inject(ManualDiskSelectionStore, true).addVdev).toHaveBeenCalled();
    });

    describe('saving', () => {
      it('returns false when resulting vdevs are the same as incoming vdevs', async () => {
        const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save Selection' }));
        await saveButton.click();

        expect(spectator.inject(MatDialogRef, true).close).toHaveBeenCalledWith(false);
      });

      it('returns new vdevs when there was change in vdevs', async () => {
        storeVdevs$.next([
          {
            uuid: UUID.UUID(),
            disks: [{ devname: 'sda' }],
          },
        ] as ManualSelectionVdev[]);
        const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save Selection' }));
        await saveButton.click();

        expect(spectator.inject(MatDialogRef, true).close).toHaveBeenCalledWith([[{ devname: 'sda' }]]);
      });

      it('returns false when Cancel button is pressed', async () => {
        const cancelButton = await loader.getHarness(MatButtonHarness.with({ text: 'Cancel' }));
        await cancelButton.click();

        expect(spectator.inject(MatDialogRef, true).close).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('vdevs limit is set', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          {
            provide: MAT_DIALOG_DATA,
            useValue: {
              inventory,
              enclosures,
              vdevs: incomingVdevs,
              layout: CreateVdevLayout.Stripe,
              vdevsLimit: 1,
            } as ManualDiskSelectionParams,
          },
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('hides the add button since the vdevs limit is reached', async () => {
      const vdevs = spectator.queryAll(ManualSelectionVdevComponent);
      expect(vdevs).toHaveLength(1);

      const addButtonRemoved = await loader.getHarnessOrNull(MatButtonHarness.with({ text: 'Add' }));
      expect(addButtonRemoved).toBeNull();
    });
  });
});
