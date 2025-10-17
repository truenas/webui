import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { firstValueFrom, Observable, of } from 'rxjs';
import { mockApi } from 'app/core/testing/utils/mock-api.utils';
import { SedStatus } from 'app/enums/sed-status.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { DiskStore } from 'app/pages/storage/modules/pool-manager/store/disk.store';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

describe('DiskStore', () => {
  let spectator: SpectatorService<DiskStore>;

  const createService = createServiceFactory({
    service: DiskStore,
    providers: [
      mockApi(),
      mockProvider(ErrorHandlerService, {
        withErrorHandler: jest.fn(() => <T>(source$: Observable<T>) => source$),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
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
      const unusedDisks = [
        { devname: 'sda', sed_status: SedStatus.Unsupported } as DetailsDisk,
      ];

      const usedDisks = [
        { devname: 'sdb', sed_status: SedStatus.Uninitialized, imported_zpool: null } as DetailsDisk,
      ];

      jest.spyOn(spectator.inject(ApiService), 'call').mockReturnValue(of({
        unused: unusedDisks,
        used: usedDisks,
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
