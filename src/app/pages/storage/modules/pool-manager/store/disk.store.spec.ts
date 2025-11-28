import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { firstValueFrom, Observable, of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { SedStatus } from 'app/enums/sed-status.enum';
import { DetailsDisk, DiskDetailsResponse } from 'app/interfaces/disk.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { DiskStore } from 'app/pages/storage/modules/pool-manager/store/disk.store';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

describe('DiskStore', () => {
  let spectator: SpectatorService<DiskStore>;

  const unusedDisks = [
    { devname: 'sda', imported_zpool: null },
    { devname: 'sdb', imported_zpool: null },
  ] as DetailsDisk[];

  const usedDisks = [
    { devname: 'sdc', imported_zpool: 'pool1' },
    { devname: 'sdd', imported_zpool: null },
  ] as DetailsDisk[];

  const diskResponse: DiskDetailsResponse = {
    unused: unusedDisks,
    used: usedDisks,
  } as DiskDetailsResponse;

  const createService = createServiceFactory({
    service: DiskStore,
    providers: [
      mockApi([
        mockCall('disk.details', diskResponse),
      ]),
      mockProvider(ErrorHandlerService, {
        withErrorHandler: jest.fn(() => <T>(source$: Observable<T>) => source$),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('should have default empty state', () => {
    expect(spectator.service.state()).toEqual({
      usedDisks: [],
      unusedDisks: [],
    });
  });

  describe('loadDisks', () => {
    it('calls disk.details API', async () => {
      await firstValueFrom(spectator.service.loadDisks());

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('disk.details');
    });

    it('updates state with unused and used disks', async () => {
      await firstValueFrom(spectator.service.loadDisks());

      expect(spectator.service.state()).toEqual({
        unusedDisks,
        usedDisks,
      });
    });

    it('returns the disk details response', async () => {
      const result = await firstValueFrom(spectator.service.loadDisks());

      expect(result).toEqual(diskResponse);
    });
  });

  describe('selectors', () => {
    beforeEach(async () => {
      await firstValueFrom(spectator.service.loadDisks());
    });

    it('usedDisks$ - returns used disks from state', async () => {
      const result = await firstValueFrom(spectator.service.usedDisks$);

      expect(result).toEqual(usedDisks);
    });

    it('selectableDisks$ - includes all unused disks', async () => {
      const selectableDisks = await firstValueFrom(spectator.service.selectableDisks$);

      expect(selectableDisks).toContainEqual(unusedDisks[0]);
      expect(selectableDisks).toContainEqual(unusedDisks[1]);
    });

    it('selectableDisks$ - includes used disks without imported_zpool', async () => {
      const selectableDisks = await firstValueFrom(spectator.service.selectableDisks$);

      // sdd has no imported_zpool, should be included
      expect(selectableDisks).toContainEqual(usedDisks[1]);
    });

    it('selectableDisks$ - excludes used disks with imported_zpool', async () => {
      const selectableDisks = await firstValueFrom(spectator.service.selectableDisks$);

      // sdc has imported_zpool, should be excluded
      expect(selectableDisks).not.toContainEqual(usedDisks[0]);
    });

    it('selectableDisks$ - returns disks sorted by devname', async () => {
      const selectableDisks = await firstValueFrom(spectator.service.selectableDisks$);

      expect(selectableDisks.map((disk) => disk.devname)).toEqual(['sda', 'sdb', 'sdd']);
    });
  });

  describe('selectableDisks$ with different data', () => {
    it('handles empty unused and used disks', async () => {
      jest.spyOn(spectator.inject(ApiService), 'call').mockReturnValue(
        of({ unused: [], used: [] } as DiskDetailsResponse),
      );

      await firstValueFrom(spectator.service.loadDisks());
      const selectableDisks = await firstValueFrom(spectator.service.selectableDisks$);

      expect(selectableDisks).toEqual([]);
    });

    it('handles only unused disks', async () => {
      jest.spyOn(spectator.inject(ApiService), 'call').mockReturnValue(
        of({ unused: unusedDisks, used: [] } as DiskDetailsResponse),
      );

      await firstValueFrom(spectator.service.loadDisks());
      const selectableDisks = await firstValueFrom(spectator.service.selectableDisks$);

      expect(selectableDisks).toEqual(unusedDisks);
    });

    it('handles only used disks with no imported zpools', async () => {
      const usedWithoutZpool = [
        { devname: 'sde', imported_zpool: null },
        { devname: 'sdf', imported_zpool: null },
      ] as DetailsDisk[];

      jest.spyOn(spectator.inject(ApiService), 'call').mockReturnValue(
        of({ unused: [], used: usedWithoutZpool } as DiskDetailsResponse),
      );

      await firstValueFrom(spectator.service.loadDisks());
      const selectableDisks = await firstValueFrom(spectator.service.selectableDisks$);

      expect(selectableDisks).toEqual(usedWithoutZpool);
    });

    it('handles all used disks with imported zpools', async () => {
      const usedWithZpool = [
        { devname: 'sde', imported_zpool: 'pool1' },
        { devname: 'sdf', imported_zpool: 'pool2' },
      ] as DetailsDisk[];

      jest.spyOn(spectator.inject(ApiService), 'call').mockReturnValue(
        of({ unused: [], used: usedWithZpool } as DiskDetailsResponse),
      );

      await firstValueFrom(spectator.service.loadDisks());
      const selectableDisks = await firstValueFrom(spectator.service.selectableDisks$);

      expect(selectableDisks).toEqual([]);
    });
  });

  describe('hasSedCapableDisks$', () => {
    it('returns true when there are SED-capable disks with UNINITIALIZED status', async () => {
      const disks = [
        { devname: 'sda', sed_status: SedStatus.Uninitialized } as DetailsDisk,
        { devname: 'sdb', sed_status: SedStatus.Unsupported } as DetailsDisk,
      ];

      jest.spyOn(spectator.inject(ApiService), 'call').mockReturnValue(of({
        unused: disks,
        used: [],
      }));

      spectator.service.loadDisks().subscribe();

      expect(await firstValueFrom(spectator.service.hasSedCapableDisks$)).toBe(true);
    });

    it('returns true when there are SED-capable disks with UNLOCKED status', async () => {
      const disks = [
        { devname: 'sda', sed_status: SedStatus.Locked } as DetailsDisk,
        { devname: 'sdb', sed_status: SedStatus.Unlocked } as DetailsDisk,
      ];

      jest.spyOn(spectator.inject(ApiService), 'call').mockReturnValue(of({
        unused: disks,
        used: [],
      }));

      spectator.service.loadDisks().subscribe();

      expect(await firstValueFrom(spectator.service.hasSedCapableDisks$)).toBe(true);
    });

    it('returns false when there are no SED-capable disks', async () => {
      const disks = [
        { devname: 'sda', sed_status: SedStatus.Locked } as DetailsDisk,
        { devname: 'sdb', sed_status: SedStatus.Unsupported } as DetailsDisk,
      ];

      jest.spyOn(spectator.inject(ApiService), 'call').mockReturnValue(of({
        unused: disks,
        used: [],
      }));

      spectator.service.loadDisks().subscribe();

      expect(await firstValueFrom(spectator.service.hasSedCapableDisks$)).toBe(false);
    });

    it('returns false when there are no disks', async () => {
      jest.spyOn(spectator.inject(ApiService), 'call').mockReturnValue(of({
        unused: [],
        used: [],
      }));

      spectator.service.loadDisks().subscribe();

      expect(await firstValueFrom(spectator.service.hasSedCapableDisks$)).toBe(false);
    });

    it('checks both unused and used disks for SED capability', async () => {
      const unusedSedDisks = [
        { devname: 'sda', sed_status: SedStatus.Unsupported } as DetailsDisk,
      ];

      const usedSedDisks = [
        { devname: 'sdb', sed_status: SedStatus.Uninitialized, imported_zpool: null } as DetailsDisk,
      ];

      jest.spyOn(spectator.inject(ApiService), 'call').mockReturnValue(of({
        unused: unusedSedDisks,
        used: usedSedDisks,
      }));

      spectator.service.loadDisks().subscribe();

      expect(await firstValueFrom(spectator.service.hasSedCapableDisks$)).toBe(true);
    });

    it('returns true when mixed SED and non-SED disks are present', async () => {
      const disks = [
        { devname: 'sda', sed_status: SedStatus.Uninitialized } as DetailsDisk,
        { devname: 'sdb', sed_status: SedStatus.Unsupported } as DetailsDisk,
        { devname: 'sdc', sed_status: SedStatus.Locked } as DetailsDisk,
        { devname: 'sdd' } as DetailsDisk, // No sed_status
      ];

      jest.spyOn(spectator.inject(ApiService), 'call').mockReturnValue(of({
        unused: disks,
        used: [],
      }));

      spectator.service.loadDisks().subscribe();

      expect(await firstValueFrom(spectator.service.hasSedCapableDisks$)).toBe(true);
    });
  });
});
