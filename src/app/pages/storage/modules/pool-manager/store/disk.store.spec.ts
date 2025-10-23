import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { firstValueFrom, of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { DetailsDisk, DiskDetailsResponse } from 'app/interfaces/disk.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { DiskStore } from 'app/pages/storage/modules/pool-manager/store/disk.store';

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
});
