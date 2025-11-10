import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { of, Subject, throwError } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { AclType } from 'app/enums/acl-type.enum';
import { Acl } from 'app/interfaces/acl.interface';
import { FileSystemStat } from 'app/interfaces/filesystem-stat.interface';
import { ApiService } from 'app/modules/websocket/api.service';
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
        mockCall('filesystem.stat', mockStat),
        mockCall('filesystem.getacl', mockAcl),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('should have default initial state', () => {
    expect(spectator.service.state()).toEqual({
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

      const mountpoint$ = new Subject<string>();
      spectator.service.loadPermissions(mountpoint$);

      mountpoint$.next('/mnt/pool/dataset');

      expect(spectator.service.state().isLoading).toBe(true);

      delayedStat$.next(mockStat);
      delayedStat$.complete();
      delayedAcl$.next(mockAcl);
      delayedAcl$.complete();

      expect(spectator.service.state().isLoading).toBe(false);
    });

    it('calls filesystem.stat with mountpoint', () => {
      const mountpoint$ = of('/mnt/pool/dataset');
      spectator.service.loadPermissions(mountpoint$);

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('filesystem.stat', ['/mnt/pool/dataset']);
    });

    it('calls filesystem.getacl with mountpoint and parameters', () => {
      const mountpoint$ = of('/mnt/pool/dataset');
      spectator.service.loadPermissions(mountpoint$);

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('filesystem.getacl', ['/mnt/pool/dataset', true, true]);
    });

    it('updates state with stat and acl after successful load', () => {
      const mountpoint$ = of('/mnt/pool/dataset');
      spectator.service.loadPermissions(mountpoint$);

      expect(spectator.service.state()).toEqual({
        isLoading: false,
        stat: mockStat,
        acl: mockAcl,
      });
    });

    it('sets isLoading to false after loading completes', () => {
      const mountpoint$ = of('/mnt/pool/dataset');
      spectator.service.loadPermissions(mountpoint$);

      expect(spectator.service.state().isLoading).toBe(false);
    });

    it('handles multiple mountpoint emissions', () => {
      const mountpoint$ = new Subject<string>();

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

      spectator.service.loadPermissions(mountpoint$);

      mountpoint$.next('/mnt/pool/dataset');
      expect(spectator.service.state().stat).toEqual(mockStat);

      mountpoint$.next('/mnt/pool/other');
      expect(spectator.service.state().stat).toEqual(newStat);
      expect(spectator.service.state().acl).toEqual(newAcl);
    });

    it('resets state to initial before loading new mountpoint', () => {
      const mountpoint$ = new Subject<string>();
      spectator.service.loadPermissions(mountpoint$);

      mountpoint$.next('/mnt/pool/dataset');
      expect(spectator.service.state()).toEqual({
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

      mountpoint$.next('/mnt/pool/other');

      // State should be reset with only isLoading true
      expect(spectator.service.state()).toEqual({
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

      const mountpoint$ = of('/mnt/pool/dataset');
      spectator.service.loadPermissions(mountpoint$);

      expect(errorHandler.showErrorModal).toHaveBeenCalledWith(error);
    });

    it('sets isLoading to false on error', () => {
      jest.spyOn(spectator.inject(ApiService), 'call').mockReturnValue(
        throwError(() => new Error('API error')),
      );

      const mountpoint$ = of('/mnt/pool/dataset');
      spectator.service.loadPermissions(mountpoint$);

      expect(spectator.service.state().isLoading).toBe(false);
    });

    it('does not update stat and acl on error', () => {
      jest.spyOn(spectator.inject(ApiService), 'call').mockReturnValue(
        throwError(() => new Error('API error')),
      );

      const mountpoint$ = of('/mnt/pool/dataset');
      spectator.service.loadPermissions(mountpoint$);

      expect(spectator.service.state().stat).toBeNull();
      expect(spectator.service.state().acl).toBeNull();
    });
  });
});
