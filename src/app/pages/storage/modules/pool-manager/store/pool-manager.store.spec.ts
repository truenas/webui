import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import {
  BehaviorSubject, firstValueFrom, of,
} from 'rxjs';
import { TiB } from 'app/constants/bytes.constant';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { DiskType } from 'app/enums/disk-type.enum';
import { CreateVdevLayout, VdevType } from 'app/enums/v-dev-type.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { Enclosure } from 'app/interfaces/enclosure.interface';
import { ManualDiskSelectionComponent, ManualDiskSelectionParams } from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/manual-disk-selection.component';
import { DispersalStrategy } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/2-enclosure-wizard-step/enclosure-wizard-step.component';
import { DiskStore } from 'app/pages/storage/modules/pool-manager/store/disk.store';
import {
  initialState, PoolManagerState, PoolManagerStore, PoolManagerTopologyCategory,
} from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import {
  GenerateVdevsService,
} from 'app/pages/storage/modules/pool-manager/utils/generate-vdevs/generate-vdevs.service';
import { WebSocketService } from 'app/services/ws.service';

describe('PoolManagerStore', () => {
  let spectator: SpectatorService<PoolManagerStore>;
  let dialogReturnValue = [{}] as DetailsDisk[][];

  const disks = [
    {
      devname: 'sda',
      size: 2 * TiB,
      type: DiskType.Hdd,
      enclosure: {
        id: 'id1',
        drive_bay_number: 1,
      },
      exported_zpool: 'expo',
    },
    {
      devname: 'sdb',
      size: 2 * TiB,
      type: DiskType.Ssd,
      enclosure: {
        id: 'id1',
        drive_bay_number: 2,
      },
    },
    {
      devname: 'sdc',
      type: DiskType.Hdd,
      size: 2 * TiB,
      enclosure: {
        id: 'id2',
        drive_bay_number: 1,
      },
    },
  ] as DetailsDisk[];
  const enclosures = [
    { name: 'Front', id: 'id1' },
    { name: 'Back', id: 'id2' },
  ] as Enclosure[];
  const createService = createServiceFactory({
    service: PoolManagerStore,
    providers: [
      mockWebSocket([
        mockCall('enclosure2.query', enclosures),
      ]),
      mockProvider(DiskStore, {
        loadDisks: () => of(disks),
        selectableDisks$: of(disks),
      }),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: jest.fn(() => of(dialogReturnValue)),
        })),
      }),
      GenerateVdevsService,
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  describe('selectors', () => {
    it('hasMultipleEnclosuresAfterFirstStep$ - returns true when disks after first step have multiple enclosures', async () => {
      spectator.service.initialize();
      expect(await firstValueFrom(spectator.service.hasMultipleEnclosuresAfterFirstStep$)).toBe(true);
    });

    it('allowedDisks$ – returns loaded disks applying disk and enclosure settings', async () => {
      spectator.service.initialize();
      spectator.service.setEnclosureOptions({
        limitToSingleEnclosure: 'id1',
        maximizeEnclosureDispersal: false,
        dispersalStrategy: DispersalStrategy.None,
      });
      spectator.service.setDiskWarningOptions({
        allowExportedPools: ['expo'],
        allowNonUniqueSerialDisks: false,
      });

      expect(await firstValueFrom(spectator.service.allowedDisks$)).toEqual([disks[0], disks[1]]);
    });

    it('inventory$ – returns all remaining unused disks', async () => {
      spectator.service.initialize();
      spectator.service.setEnclosureOptions({
        limitToSingleEnclosure: 'id1',
        maximizeEnclosureDispersal: false,
        dispersalStrategy: DispersalStrategy.None,
      });
      spectator.service.setManualTopologyCategory(VdevType.Data, [[disks[0]]]);

      expect(await firstValueFrom(spectator.service.inventory$)).toEqual([disks[1]]);
    });

    it('getInventoryForStep – returns disks usable in a step (including disks already used in the step)', async () => {
      spectator.service.initialize();
      spectator.service.setManualTopologyCategory(VdevType.Data, [[disks[0]]]);

      const inventory = await firstValueFrom(spectator.service.getInventoryForStep(VdevType.Data));
      expect(inventory).toHaveLength(2);
      const diskNames = inventory.map((disk) => disk.devname).sort((a, b) => a.localeCompare(b));
      expect(diskNames).toEqual(['sdb', 'sdc']);
    });
  });

  describe('initialize', () => {
    it('loads enclosures', async () => {
      spectator.service.initialize();

      const websocket = spectator.inject(WebSocketService);
      expect(websocket.call).toHaveBeenCalledWith('enclosure2.query');

      expect(await firstValueFrom(spectator.service.state$)).toMatchObject({
        ...initialState,
        enclosures,
        isLoading: false,
      });
    });
  });

  describe('start over functionality', () => {
    it('reverts state to initial state', async () => {
      spectator.service.startOver();

      expect(await firstValueFrom(spectator.service.state$)).toMatchObject({
        ...initialState,
        enclosures,
      });
    });
  });

  describe('methods - options', () => {
    it('setGeneralOptions - sets options such as name and encryption', async () => {
      const generalOptions = {
        name: 'tank',
        encryption: 'AES-128',
        nameErrors: null,
      } as PoolManagerState;
      spectator.service.setGeneralOptions(generalOptions);

      expect(await firstValueFrom(spectator.service.state$)).toMatchObject({
        ...initialState,
        name: generalOptions.name,
        encryption: generalOptions.encryption,
        nameErrors: null,
      });
    });

    it('setEnclosureSettings – sets enclosure settings', async () => {
      const enclosureSettings = {
        limitToSingleEnclosure: 'id5',
        maximizeEnclosureDispersal: false,
        dispersalStrategy: DispersalStrategy.None,
      };
      spectator.service.setEnclosureOptions(enclosureSettings);

      expect(await firstValueFrom(spectator.service.state$)).toMatchObject({
        ...initialState,
        enclosureSettings,
      });
    });

    it('setDiskWarningOptions – sets disk warning options', async () => {
      const diskSettings = {
        allowNonUniqueSerialDisks: true,
        allowExportedPools: ['pool1', 'pool2'],
      };
      spectator.service.setDiskWarningOptions(diskSettings);

      expect(await firstValueFrom(spectator.service.state$)).toMatchObject({
        ...initialState,
        diskSettings,
      });
    });
  });

  describe('methods - working with topology categories', () => {
    it('setManualTopologyCategory – sets manually configured vdevs for a category', async () => {
      const manuallyConfiguredVdevs = [{}] as DetailsDisk[][];
      spectator.service.setManualTopologyCategory(VdevType.Data, manuallyConfiguredVdevs);

      expect(await firstValueFrom(spectator.service.state$)).toMatchObject({
        ...initialState,
        topology: {
          ...initialState.topology,
          [VdevType.Data]: {
            hasCustomDiskSelection: true,
            vdevs: manuallyConfiguredVdevs,
          },
        },
        categorySequence: [
          VdevType.Log,
          VdevType.Spare,
          VdevType.Cache,
          VdevType.Special,
          VdevType.Dedup,
          VdevType.Data,
        ],
      });
    });

    it('setAutomaticTopologyCategory – sets settings for topology category and generates vdevs for it', async () => {
      jest.spyOn(spectator.inject(GenerateVdevsService), 'generateVdevs');
      spectator.service.initialize();
      spectator.service.setAutomaticTopologyCategory(VdevType.Data, {
        diskSize: 2 * TiB,
        width: 1,
        layout: CreateVdevLayout.Stripe,
        diskType: DiskType.Hdd,
        vdevsNumber: 1,
        treatDiskSizeAsMinimum: false,
      });

      expect(spectator.inject(GenerateVdevsService).generateVdevs).toHaveBeenCalled();

      const state = await firstValueFrom(spectator.service.state$);
      expect(state.topology[VdevType.Data]).toEqual({
        diskSize: 2 * TiB,
        diskType: DiskType.Hdd,
        hasCustomDiskSelection: false,
        layout: CreateVdevLayout.Stripe,
        treatDiskSizeAsMinimum: false,
        vdevsNumber: 1,
        width: 1,
        vdevs: [[disks[2]]],
        draidDataDisks: 0,
        draidSpareDisks: 0,
      });
    });

    it('resetTopologyCategory – resets topology category', async () => {
      spectator.service.setManualTopologyCategory(VdevType.Data, [{}] as DetailsDisk[][]);
      spectator.service.resetTopologyCategory(VdevType.Data);

      expect(await firstValueFrom(spectator.service.state$)).toMatchObject({ topology: initialState.topology });
    });

    it('resetTopology – completely resets pool topology', async () => {
      spectator.service.setManualTopologyCategory(VdevType.Data, [{}] as DetailsDisk[][]);
      spectator.service.setManualTopologyCategory(VdevType.Log, [{}] as DetailsDisk[][]);
      spectator.service.resetTopology();

      expect(await firstValueFrom(spectator.service.state$)).toMatchObject({ topology: initialState.topology });
    });
  });

  describe('methods - openManualSelectionDialog', () => {
    const topologyCategory = {
      layout: CreateVdevLayout.Stripe,
      vdevs: [
        [{ devname: 'sda' }],
      ],
      hasCustomDiskSelection: false,
    } as PoolManagerTopologyCategory;

    const state = {
      topology: {
        [VdevType.Data]: topologyCategory,
      },
      enclosures,
    } as PoolManagerState;
    const state$ = new BehaviorSubject(state);
    const inventory = [
      { devname: 'sda' },
      { devname: 'sdb' },
    ] as DetailsDisk[];
    it('opens manual selection dialog when one of the child components emits (manualSelectionClicked)', () => {
      Object.defineProperty(spectator.service, 'state$', { value: state$ });
      jest.spyOn(spectator.service, 'getInventoryForStep').mockReturnValue(of(inventory));
      jest.spyOn(spectator.service, 'setManualTopologyCategory');
      spectator.service.openManualSelectionDialog(VdevType.Data);

      expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(ManualDiskSelectionComponent, {
        data: {
          enclosures,
          inventory: [expect.objectContaining({ devname: 'sdb' })],
          vdevs: topologyCategory.vdevs,
          layout: topologyCategory.layout,
          vdevsLimit: null,
        } as ManualDiskSelectionParams,
        panelClass: 'manual-selection-dialog',
      });

      expect(spectator.service.setManualTopologyCategory)
        .toHaveBeenCalledWith(VdevType.Data, dialogReturnValue);
    });

    it('resets layout when manual selection dialog results in no vdevs', () => {
      dialogReturnValue = [];
      jest.spyOn(spectator.service, 'resetTopologyCategory');
      const openFnSpy = jest.spyOn(spectator.inject(MatDialog), 'open');
      openFnSpy.mockImplementation(() => {
        return {
          afterClosed: () => of([]),
        } as unknown as MatDialogRef<unknown>;
      });
      spectator.service.openManualSelectionDialog(VdevType.Data);
      expect(spectator.service.resetTopologyCategory).toHaveBeenCalledWith(VdevType.Data);
    });
  });
});
