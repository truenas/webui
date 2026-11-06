import { DialogRef } from '@angular/cdk/dialog';
import { signal } from '@angular/core';
import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { TnDialog } from '@truenas/ui-components';
import { of } from 'rxjs';
import { TiB } from 'app/constants/bytes.constant';
import { mockApi, mockQuery, settleApi } from 'app/core/testing/utils/mock-api.utils';
import { DiskType } from 'app/enums/disk-type.enum';
import { CreateVdevLayout, VDevType } from 'app/enums/v-dev-type.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { Enclosure } from 'app/interfaces/enclosure.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { ManualDiskSelectionComponent, ManualDiskSelectionParams } from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/manual-disk-selection.component';
import { DispersalStrategy } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/2-enclosure-wizard-step/enclosure-wizard-step.component';
import { EncryptionType } from 'app/pages/storage/modules/pool-manager/enums/encryption-type.enum';
import { DiskStore } from 'app/pages/storage/modules/pool-manager/store/disk.store';
import {
  initialState, PoolManagerState, PoolManagerStore,
} from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import {
  GenerateVdevsService,
} from 'app/pages/storage/modules/pool-manager/utils/generate-vdevs/generate-vdevs.service';

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
      mockApi([
        mockQuery('enclosure2.query', enclosures as unknown as WebUiQueryEntity<'enclosure2.query'>[]),
      ]),
      mockProvider(DiskStore, {
        loadDisks: () => of(disks),
        selectableDisks: signal(disks),
        hasSedCapableDisks: signal(false),
      }),
      mockProvider(TnDialog, {
        open: jest.fn(() => ({
          closed: of(dialogReturnValue),
        })),
      }),
      GenerateVdevsService,
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  describe('selectors', () => {
    it('hasMultipleEnclosuresAfterFirstStep - returns true when disks after first step have multiple enclosures', () => {
      spectator.service.initialize();
      expect(spectator.service.hasMultipleEnclosuresAfterFirstStep()).toBe(true);
    });

    it('allowedDisks – returns loaded disks applying disk and enclosure settings', () => {
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

      expect(spectator.service.allowedDisks()).toEqual([disks[0], disks[1]]);
    });

    it('inventory – returns all remaining Unassigned Disks', () => {
      spectator.service.initialize();
      spectator.service.setEnclosureOptions({
        limitToSingleEnclosure: 'id1',
        maximizeEnclosureDispersal: false,
        dispersalStrategy: DispersalStrategy.None,
      });
      spectator.service.setManualTopologyCategory(VDevType.Data, [[disks[0]]]);

      expect(spectator.service.inventory()).toEqual([disks[1]]);
    });

    it('getInventoryForStep – returns disks usable in a step (including disks already used in the step)', () => {
      spectator.service.initialize();
      spectator.service.setManualTopologyCategory(VDevType.Data, [[disks[0]]]);

      const inventory = spectator.service.getInventoryForStep(VDevType.Data)();
      expect(inventory).toHaveLength(2);
      const diskNames = inventory.map((disk) => disk.devname).sort((a, b) => a.localeCompare(b));
      expect(diskNames).toEqual(['sdb', 'sdc']);
    });
  });

  describe('initialize', () => {
    it('loads enclosures', async () => {
      spectator.service.initialize();
      await settleApi();

      const api = spectator.inject(ApiService);
      expect(api.query).toHaveBeenCalledWith('enclosure2.query');

      expect(spectator.service.enclosures()).toEqual(enclosures);
      expect(spectator.service.isLoading()).toBe(false);
      expect(spectator.service.topology()).toEqual(initialState.topology);
    });
  });

  describe('start over functionality', () => {
    it('reverts state to initial state', async () => {
      spectator.service.setGeneralOptions({ name: 'tank', nameErrors: null });
      spectator.service.setManualTopologyCategory(VDevType.Data, [[disks[0]]]);
      const startOver = jest.fn();
      spectator.service.startOver$.subscribe(startOver);

      spectator.service.startOver();
      expect(spectator.service.isLoading()).toBe(true);
      await settleApi();

      expect(startOver).toHaveBeenCalled();
      expect(spectator.service.name()).toBe('');
      expect(spectator.service.topology()).toEqual(initialState.topology);
      expect(spectator.service.enclosures()).toEqual(enclosures);
      expect(spectator.service.isLoading()).toBe(false);
    });
  });

  describe('methods - options', () => {
    it('setGeneralOptions - sets options such as name', () => {
      const generalOptions = {
        name: 'tank',
        nameErrors: null,
      } as PoolManagerState;
      spectator.service.setGeneralOptions(generalOptions);

      expect(spectator.service.name()).toBe(generalOptions.name);
      expect(spectator.service.nameErrors()).toBeNull();
    });

    it('setEnclosureSettings – sets enclosure settings', () => {
      const enclosureSettings = {
        limitToSingleEnclosure: 'id5',
        maximizeEnclosureDispersal: false,
        dispersalStrategy: DispersalStrategy.None,
      };
      spectator.service.setEnclosureOptions(enclosureSettings);

      expect(spectator.service.enclosureSettings()).toEqual(enclosureSettings);
    });

    it('setDiskWarningOptions – sets disk warning options', () => {
      const diskSettings = {
        allowNonUniqueSerialDisks: true,
        allowExportedPools: ['pool1', 'pool2'],
      };
      spectator.service.setDiskWarningOptions(diskSettings);

      expect(spectator.service.diskSettings()).toEqual(diskSettings);
    });
  });

  describe('methods - working with topology categories', () => {
    it('setManualTopologyCategory – sets manually configured vdevs for a category', () => {
      const manuallyConfiguredVdevs = [{}] as DetailsDisk[][];
      spectator.service.setManualTopologyCategory(VDevType.Data, manuallyConfiguredVdevs);

      expect(spectator.service.topology()).toMatchObject({
        ...initialState.topology,
        [VDevType.Data]: {
          hasCustomDiskSelection: true,
          vdevs: manuallyConfiguredVdevs,
        },
      });
      expect(spectator.service.categorySequence()).toEqual([
        VDevType.Log,
        VDevType.Spare,
        VDevType.Cache,
        VDevType.Special,
        VDevType.Dedup,
        VDevType.Data,
      ]);
    });

    it('setAutomaticTopologyCategory – sets settings for topology category and generates vdevs for it', () => {
      jest.spyOn(spectator.inject(GenerateVdevsService), 'generateVdevs');
      spectator.service.initialize();
      spectator.service.setAutomaticTopologyCategory(VDevType.Data, {
        diskSize: 2 * TiB,
        width: 1,
        layout: CreateVdevLayout.Stripe,
        diskType: DiskType.Hdd,
        vdevsNumber: 1,
        treatDiskSizeAsMinimum: false,
      });

      expect(spectator.inject(GenerateVdevsService).generateVdevs).toHaveBeenCalled();

      expect(spectator.service.topology()[VDevType.Data]).toEqual({
        diskSize: 2 * TiB,
        diskType: DiskType.Hdd,
        isDiskSizeAutoSelected: false,
        hasCustomDiskSelection: false,
        layout: CreateVdevLayout.Stripe,
        treatDiskSizeAsMinimum: false,
        vdevsNumber: 1,
        width: 1,
        vdevs: [[disks[2]]],
        draidDataDisks: null,
        draidSpareDisks: null,
      });
    });

    it('resetTopologyCategory – resets topology category', () => {
      spectator.service.setManualTopologyCategory(VDevType.Data, [{}] as DetailsDisk[][]);
      spectator.service.resetTopologyCategory(VDevType.Data);

      expect(spectator.service.topology()).toMatchObject(initialState.topology);
    });

    it('setTopologyCategoryLayout – keeps configured dedicated spares when switching the data layout to dRAID', () => {
      const spareVdevs = [[{ devname: 'sda' }]] as DetailsDisk[][];
      spectator.service.setManualTopologyCategory(VDevType.Spare, spareVdevs);

      spectator.service.setTopologyCategoryLayout(VDevType.Data, CreateVdevLayout.Draid1);

      expect(spectator.service.topology()[VDevType.Data].layout).toBe(CreateVdevLayout.Draid1);
      expect(spectator.service.topology()[VDevType.Spare].vdevs).toEqual(spareVdevs);

      // Changing the dRAID parity must not discard already-configured spares.
      spectator.service.setTopologyCategoryLayout(VDevType.Data, CreateVdevLayout.Draid2);

      expect(spectator.service.topology()[VDevType.Data].layout).toBe(CreateVdevLayout.Draid2);
      expect(spectator.service.topology()[VDevType.Spare].vdevs).toEqual(spareVdevs);
    });

    it('resetTopology – completely resets pool topology', () => {
      spectator.service.setManualTopologyCategory(VDevType.Data, [{}] as DetailsDisk[][]);
      spectator.service.setManualTopologyCategory(VDevType.Log, [{}] as DetailsDisk[][]);
      spectator.service.resetTopology();

      expect(spectator.service.topology()).toMatchObject(initialState.topology);
    });
  });

  describe('methods - openManualSelectionDialog', () => {
    const dataVdevs = [[disks[0]]];

    beforeEach(async () => {
      spectator.service.initialize();
      await settleApi();
      // Leaves sdb as the only allowed disk: sda has an exported pool, sdc is in the other enclosure.
      spectator.service.setEnclosureOptions({
        limitToSingleEnclosure: 'id1',
        maximizeEnclosureDispersal: false,
        dispersalStrategy: DispersalStrategy.LimitToSingle,
      });
      spectator.service.setTopologyCategoryLayout(VDevType.Data, CreateVdevLayout.Stripe);
      spectator.service.setManualTopologyCategory(VDevType.Data, dataVdevs);
    });

    it('opens manual selection dialog when one of the child components emits (manualSelectionClicked)', () => {
      jest.spyOn(spectator.service, 'setManualTopologyCategory');
      spectator.service.openManualSelectionDialog(VDevType.Data);

      expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(ManualDiskSelectionComponent, {
        data: {
          enclosures,
          inventory: [expect.objectContaining({ devname: 'sdb' })],
          vdevs: dataVdevs,
          layout: CreateVdevLayout.Stripe,
          vdevsLimit: null,
          isSedEncryption: false,
        } as ManualDiskSelectionParams,
        panelClass: 'manual-selection-dialog',
      });

      expect(spectator.service.setManualTopologyCategory)
        .toHaveBeenCalledWith(VDevType.Data, dialogReturnValue);
    });

    it('resets layout when manual selection dialog results in no vdevs', () => {
      dialogReturnValue = [];
      jest.spyOn(spectator.service, 'resetTopologyCategory');
      const openFnSpy = jest.spyOn(spectator.inject(TnDialog), 'open');
      openFnSpy.mockImplementation(() => {
        return {
          closed: of([]),
        } as DialogRef;
      });
      spectator.service.openManualSelectionDialog(VDevType.Data);
      expect(spectator.service.resetTopologyCategory).toHaveBeenCalledWith(VDevType.Data);
    });
  });

  describe('SED encryption', () => {
    describe('setEncryptionOptions', () => {
      it('sets encryption type and SED password', () => {
        spectator.service.setEncryptionOptions({
          encryptionType: EncryptionType.Sed,
          sedPassword: 'mypassword',
        });

        expect(spectator.service.encryptionType()).toBe(EncryptionType.Sed);
        expect(spectator.service.sedPassword()).toBe('mypassword');
      });

      it('sets software encryption', () => {
        spectator.service.setEncryptionOptions({
          encryptionType: EncryptionType.Software,
          sedPassword: null,
        });

        expect(spectator.service.encryptionType()).toBe(EncryptionType.Software);
        expect(spectator.service.sedPassword()).toBeNull();
      });

      it('sets no encryption', () => {
        spectator.service.setEncryptionOptions({
          encryptionType: EncryptionType.None,
          sedPassword: null,
        });

        expect(spectator.service.encryptionType()).toBe(EncryptionType.None);
        expect(spectator.service.sedPassword()).toBeNull();
      });

      it('resets topology categories holding non-SED-capable disks when switching to SED', () => {
        spectator.service.setManualTopologyCategory(VDevType.Data, [[disks[0]]]);

        spectator.service.setEncryptionOptions({
          encryptionType: EncryptionType.Sed,
          sedPassword: 'mypassword',
        });

        expect(spectator.service.topology()[VDevType.Data].vdevs).toEqual([]);
      });
    });

    describe('setHasSedCapableDisks', () => {
      it('sets hasSedCapableDisks to true', () => {
        spectator.service.setHasSedCapableDisks(true);

        expect(spectator.service.hasSedCapableDisks()).toBe(true);
      });

      it('sets hasSedCapableDisks to false', () => {
        spectator.service.setHasSedCapableDisks(false);

        expect(spectator.service.hasSedCapableDisks()).toBe(false);
      });
    });

    describe('selectors', () => {
      it('encryptionType - returns encryption type', () => {
        spectator.service.setEncryptionOptions({
          encryptionType: EncryptionType.Sed,
          sedPassword: 'password',
        });

        expect(spectator.service.encryptionType()).toBe(EncryptionType.Sed);
      });

      it('sedPassword - returns SED password', () => {
        spectator.service.setEncryptionOptions({
          encryptionType: EncryptionType.Sed,
          sedPassword: 'mypassword',
        });

        expect(spectator.service.sedPassword()).toBe('mypassword');
      });

      it('hasSedCapableDisks - returns whether SED-capable disks are available', () => {
        spectator.service.setHasSedCapableDisks(true);

        expect(spectator.service.hasSedCapableDisks()).toBe(true);
      });
    });
  });
});
