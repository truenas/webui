import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { firstValueFrom } from 'rxjs';
import { TiB } from 'app/constants/bytes.constant';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { DiskType } from 'app/enums/disk-type.enum';
import { CreateVdevLayout, VdevType } from 'app/enums/v-dev-type.enum';
import { Enclosure } from 'app/interfaces/enclosure.interface';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import { DispersalStrategy } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/2-enclosure-wizard-step/enclosure-wizard-step.component';
import { initialState, PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import {
  GenerateVdevsService,
} from 'app/pages/storage/modules/pool-manager/utils/generate-vdevs/generate-vdevs.service';
import { WebSocketService } from 'app/services/ws.service';

describe('PoolManagerStore', () => {
  let spectator: SpectatorService<PoolManagerStore>;
  const disks = [
    {
      devname: 'sda',
      size: 2 * TiB,
      type: DiskType.Hdd,
      enclosure: {
        number: 1,
        slot: 1,
      },
      exported_zpool: 'expo',
    },
    {
      devname: 'sdb',
      size: 2 * TiB,
      type: DiskType.Ssd,
      enclosure: {
        number: 1,
        slot: 1,
      },
    },
    {
      devname: 'sdc',
      type: DiskType.Hdd,
      size: 2 * TiB,
    },
  ] as UnusedDisk[];
  const enclosures = [
    { name: 'Front', number: 1 },
    { name: 'Back', number: 2 },
  ] as Enclosure[];
  const createService = createServiceFactory({
    service: PoolManagerStore,
    providers: [
      mockWebsocket([
        mockCall('disk.get_unused', disks),
        mockCall('enclosure.query', enclosures),
      ]),
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
        limitToSingleEnclosure: 1,
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
        limitToSingleEnclosure: 1,
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
      expect(inventory).toHaveLength(3);
      const diskNames = inventory.map((disk) => disk.devname).sort();
      expect(diskNames).toEqual(['sda', 'sdb', 'sdc']);
    });
  });

  describe('initialize', () => {
    it('loads disks and enclosures', async () => {
      spectator.service.initialize();

      const websocket = spectator.inject(WebSocketService);
      expect(websocket.call).toHaveBeenCalledWith('disk.get_unused');
      expect(websocket.call).toHaveBeenCalledWith('enclosure.query');

      expect(await firstValueFrom(spectator.service.state$)).toMatchObject({
        ...initialState,
        enclosures,
        isLoading: false,
        allDisks: disks,
      });
    });
  });

  describe('start over functionality', () => {
    it('reverts state to initial state', async () => {
      spectator.service.startOver();

      expect(await firstValueFrom(spectator.service.state$)).toMatchObject({
        ...initialState,
        enclosures,
        allDisks: disks,
      });
    });
  });

  describe('methods - options', () => {
    it('setGeneralOptions - sets options such as name and encryption', async () => {
      const generalOptions = {
        name: 'tank',
        encryption: 'AES-128',
      };
      spectator.service.setGeneralOptions(generalOptions);

      expect(await firstValueFrom(spectator.service.state$)).toMatchObject({
        ...initialState,
        name: generalOptions.name,
        encryption: generalOptions.encryption,
      });
    });

    it('setEnclosureSettings – sets enclosure settings', async () => {
      const enclosureSettings = {
        limitToSingleEnclosure: 5,
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
      const manuallyConfiguredVdevs = [{}] as UnusedDisk[][];
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
      });
    });

    it('resetTopologyCategory – resets topology category', async () => {
      spectator.service.setManualTopologyCategory(VdevType.Data, [{}] as UnusedDisk[][]);
      spectator.service.resetTopologyCategory(VdevType.Data);

      expect(await firstValueFrom(spectator.service.state$)).toMatchObject(initialState);
    });

    it('resetTopology – completely resets pool topology', async () => {
      spectator.service.setManualTopologyCategory(VdevType.Data, [{}] as UnusedDisk[][]);
      spectator.service.setManualTopologyCategory(VdevType.Log, [{}] as UnusedDisk[][]);
      spectator.service.resetTopology();

      expect(await firstValueFrom(spectator.service.state$)).toMatchObject(initialState);
    });
  });
});
