import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { CallResponse } from '@truenas/api-client';
import { of, Subject, throwError } from 'rxjs';
import { mockApi, mockCall, settleApi } from 'app/core/testing/utils/mock-api.utils';
import { AclType } from 'app/enums/acl-type.enum';
import { Acl } from 'app/interfaces/acl.interface';
import { FileSystemStat } from 'app/interfaces/filesystem-stat.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { PermissionsCardState } from 'app/pages/datasets/modules/permissions/interfaces/permissions-sidebar-state.interface';
import { PermissionsCardStore } from 'app/pages/datasets/modules/permissions/stores/permissions-card.store';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

describe('PermissionsCardStore', () => {
  let spectator: SpectatorService<PermissionsCardStore>;

  const mockStat = {
    user: 'root',
    group: 'wheel',
    mode: 16877,
  } as FileSystemStat;

  const mockAcl = {
    acltype: AclType.Nfs4,
    trivial: false,
    uid: 0,
    gid: 0,
    acl: [],
    nfs41_flags: { autoinherit: false, protected: false },
  } as Acl;

  const createService = createServiceFactory({
    service: PermissionsCardStore,
    providers: [
      mockApi([
        mockCall('filesystem.stat', mockStat as CallResponse<WebUiApiDirectory, 'filesystem.stat'>),
        mockCall('filesystem.getacl', mockAcl as unknown as CallResponse<WebUiApiDirectory, 'filesystem.getacl'>),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  /** Everything the store exposes, read in one go. */
  const state = (): PermissionsCardState => ({
    isLoading: spectator.service.isLoading(),
    stat: spectator.service.stat(),
    acl: spectator.service.acl(),
  });

  it('should have default initial state', () => {
    expect(state()).toEqual({
      isLoading: false,
      acl: null,
      stat: null,
    });
  });

  describe('loadPermissions', () => {
    it('sets isLoading to true when starting to load', () => {
      const delayedStat$ = new Subject<FileSystemStat>();
      const delayedAcl$ = new Subject<Acl>();

      jest.spyOn(spectator.inject(ApiService), 'call').mockImplementation((method) => {
        if (method === 'filesystem.stat') {
          return delayedStat$;
        }
        return delayedAcl$;
      });

      spectator.service.loadPermissions('/mnt/pool/dataset');

      expect(state().isLoading).toBe(true);

      delayedStat$.next(mockStat);
      delayedStat$.complete();
      delayedAcl$.next(mockAcl);
      delayedAcl$.complete();

      expect(state().isLoading).toBe(false);
    });

    it('calls filesystem.stat with mountpoint', () => {
      spectator.service.loadPermissions('/mnt/pool/dataset');

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('filesystem.stat', ['/mnt/pool/dataset']);
    });

    it('calls filesystem.getacl with mountpoint and parameters', () => {
      spectator.service.loadPermissions('/mnt/pool/dataset');

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('filesystem.getacl', ['/mnt/pool/dataset', true, true]);
    });

    it('updates state with stat and acl after successful load', async () => {
      spectator.service.loadPermissions('/mnt/pool/dataset');
      await settleApi();

      expect(state()).toEqual({
        isLoading: false,
        stat: mockStat,
        acl: mockAcl,
      });
    });

    it('sets isLoading to false after loading completes', async () => {
      spectator.service.loadPermissions('/mnt/pool/dataset');
      await settleApi();

      expect(state().isLoading).toBe(false);
    });

    it('handles multiple mountpoint emissions', () => {
      const newStat = { user: 'user1' } as FileSystemStat;
      const newAcl = {
        acltype: AclType.Posix1e,
        trivial: true,
        uid: 1,
        gid: 1,
        acl: [],
        flags: { setuid: false, setgid: false, sticky: false },
      } as Acl;

      let callCount = 0;
      jest.spyOn(spectator.inject(ApiService), 'call').mockImplementation((method) => {
        callCount++;
        if (callCount <= 2) {
          // First mountpoint emission - return mock data
          if (method === 'filesystem.stat') {
            return of(mockStat);
          }
          return of(mockAcl);
        }
        // Second mountpoint emission - return new data
        if (method === 'filesystem.stat') {
          return of(newStat);
        }
        return of(newAcl);
      });

      spectator.service.loadPermissions('/mnt/pool/dataset');
      expect(state().stat).toEqual(mockStat);

      spectator.service.loadPermissions('/mnt/pool/other');
      expect(state().stat).toEqual(newStat);
      expect(state().acl).toEqual(newAcl);
    });

    it('resets state to initial before loading new mountpoint', async () => {
      spectator.service.loadPermissions('/mnt/pool/dataset');
      await settleApi();
      expect(state()).toEqual({
        isLoading: false,
        stat: mockStat,
        acl: mockAcl,
      });

      const delayedStat$ = new Subject<FileSystemStat>();
      const delayedAcl$ = new Subject<Acl>();
      jest.spyOn(spectator.inject(ApiService), 'call').mockImplementation((method) => {
        if (method === 'filesystem.stat') {
          return delayedStat$;
        }
        return delayedAcl$;
      });

      spectator.service.loadPermissions('/mnt/pool/other');

      // State should be reset with only isLoading true
      expect(state()).toEqual({
        isLoading: true,
        stat: null,
        acl: null,
      });
    });
  });

  describe('error handling', () => {
    it('shows error modal when loading fails', () => {
      const error = new Error('Failed to load permissions');
      jest.spyOn(spectator.inject(ApiService), 'call').mockReturnValue(
        throwError(() => error),
      );
      const errorHandler = spectator.inject(ErrorHandlerService);
      jest.spyOn(errorHandler, 'showErrorModal');

      spectator.service.loadPermissions('/mnt/pool/dataset');

      expect(errorHandler.showErrorModal).toHaveBeenCalledWith(error);
    });

    it('sets isLoading to false on error', () => {
      jest.spyOn(spectator.inject(ApiService), 'call').mockReturnValue(
        throwError(() => new Error('API error')),
      );

      spectator.service.loadPermissions('/mnt/pool/dataset');

      expect(state().isLoading).toBe(false);
    });

    it('does not update stat and acl on error', () => {
      jest.spyOn(spectator.inject(ApiService), 'call').mockReturnValue(
        throwError(() => new Error('API error')),
      );

      spectator.service.loadPermissions('/mnt/pool/dataset');

      expect(state().stat).toBeNull();
      expect(state().acl).toBeNull();
    });
  });

  it('reset() clears what was loaded', async () => {
    spectator.service.loadPermissions('/mnt/pool/dataset');
    await settleApi();

    spectator.service.reset();

    expect(state()).toEqual({ isLoading: false, stat: null, acl: null });
  });
});
