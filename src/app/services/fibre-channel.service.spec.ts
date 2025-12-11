import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { lastValueFrom, of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { FcPortFormValue, FibreChannelHost, FibreChannelPort } from 'app/interfaces/fibre-channel.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { FibreChannelService } from 'app/services/fibre-channel.service';

describe('FibreChannelService', () => {
  let spectator: SpectatorService<FibreChannelService>;
  const fakeTargetId = 11;
  const fakeHostId = 22;
  const fakePortId = 33;

  const createService = createServiceFactory({
    service: FibreChannelService,
    providers: [
      mockApi([
        mockCall('fcport.query', [{ id: fakePortId, port: 'fc/2' }] as FibreChannelPort[]),
        mockCall('fcport.create'),
        mockCall('fcport.update'),
        mockCall('fcport.delete'),
        mockCall('fc.fc_host.query', [{ id: fakeHostId, alias: 'fc', npiv: 1 }] as FibreChannelHost[]),
        mockCall('fc.fc_host.update'),
      ]),
    ],
  });

  beforeEach(() => spectator = createService());

  describe('loadTargetPorts', () => {
    it('returns empty array when target has no ports', async () => {
      jest.spyOn(spectator.inject(ApiService), 'call').mockReturnValue(of([]));

      const result = await lastValueFrom(spectator.service.loadTargetPorts(fakeTargetId));

      expect(result).toEqual([]);
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith(
        'fcport.query',
        [[['target.id', '=', fakeTargetId]]],
      );
    });

    it('returns array with single port', async () => {
      const port = { id: 1, port: 'fc0' } as FibreChannelPort;
      jest.spyOn(spectator.inject(ApiService), 'call').mockReturnValue(of([port]));

      const result = await lastValueFrom(spectator.service.loadTargetPorts(fakeTargetId));

      expect(result).toEqual([port]);
    });

    it('returns array with multiple ports', async () => {
      const ports = [
        { id: 1, port: 'fc0' },
        { id: 2, port: 'fc1' },
        { id: 3, port: 'fc0/1' },
      ] as FibreChannelPort[];
      jest.spyOn(spectator.inject(ApiService), 'call').mockReturnValue(of(ports));

      const result = await lastValueFrom(spectator.service.loadTargetPorts(fakeTargetId));

      expect(result).toEqual(ports);
    });
  });

  describe('validatePhysicalHbaUniqueness', () => {
    it('returns valid when no ports provided', () => {
      const result = spectator.service.validatePhysicalHbaUniqueness([]);

      expect(result).toEqual({ valid: true, duplicates: [] });
    });

    it('returns valid when all ports have null port string', () => {
      const ports: FcPortFormValue[] = [
        { port: null, host_id: 1 },
        { port: null, host_id: 2 },
      ];

      const result = spectator.service.validatePhysicalHbaUniqueness(ports);

      expect(result).toEqual({ valid: true, duplicates: [] });
    });

    it('returns valid when ports use different physical HBAs', () => {
      const ports: FcPortFormValue[] = [
        { port: 'fc0', host_id: null },
        { port: 'fc1', host_id: null },
        { port: 'fc2/1', host_id: null },
      ];

      const result = spectator.service.validatePhysicalHbaUniqueness(ports);

      expect(result).toEqual({ valid: true, duplicates: [] });
    });

    it('returns invalid when same physical HBA used twice (basic)', () => {
      const ports: FcPortFormValue[] = [
        { port: 'fc0', host_id: null },
        { port: 'fc0/1', host_id: null },
      ];

      const result = spectator.service.validatePhysicalHbaUniqueness(ports);

      expect(result).toEqual({ valid: false, duplicates: ['fc0'] });
    });

    it('returns invalid when same physical HBA used twice (NPIV ports)', () => {
      const ports: FcPortFormValue[] = [
        { port: 'fc1/2', host_id: null },
        { port: 'fc1/3', host_id: null },
      ];

      const result = spectator.service.validatePhysicalHbaUniqueness(ports);

      expect(result).toEqual({ valid: false, duplicates: ['fc1'] });
    });

    it('returns invalid with multiple duplicate HBAs', () => {
      const ports: FcPortFormValue[] = [
        { port: 'fc0', host_id: null },
        { port: 'fc0/1', host_id: null },
        { port: 'fc1/2', host_id: null },
        { port: 'fc1/3', host_id: null },
      ];

      const result = spectator.service.validatePhysicalHbaUniqueness(ports);

      expect(result.valid).toBe(false);
      expect(result.duplicates).toContain('fc0');
      expect(result.duplicates).toContain('fc1');
    });
  });

  describe('linkFiberChannelPortsToTarget', () => {
    it('handles 0→0 transition (no existing, no desired)', async () => {
      jest.spyOn(spectator.inject(ApiService), 'call').mockImplementation((method) => {
        if (method === 'fcport.query') {
          return of([]);
        }
        return of(null);
      });

      const result = await lastValueFrom(
        spectator.service.linkFiberChannelPortsToTarget(fakeTargetId, []),
      );

      expect(result).toBe(true);
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith(
        'fcport.query',
        [[['target.id', '=', fakeTargetId]]],
      );
      // Should not call create or delete
      expect(spectator.inject(ApiService).call).toHaveBeenCalledTimes(1);
    });

    it('handles 0→1 transition (create single port)', async () => {
      jest.spyOn(spectator.inject(ApiService), 'call').mockImplementation((method) => {
        if (method === 'fcport.query') {
          return of([]);
        }
        if (method === 'fcport.create') {
          return of({ id: 1, port: 'fc0' });
        }
        return of(null);
      });

      await lastValueFrom(
        spectator.service.linkFiberChannelPortsToTarget(fakeTargetId, [
          { port: 'fc0', host_id: null },
        ]),
      );

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith(
        'fcport.create',
        [{ port: 'fc0', target_id: fakeTargetId }],
      );
    });

    it('handles 1→0 transition (delete existing port)', async () => {
      const existingPort = { id: 1, port: 'fc0' } as FibreChannelPort;
      jest.spyOn(spectator.inject(ApiService), 'call').mockImplementation((method) => {
        if (method === 'fcport.query') {
          return of([existingPort]);
        }
        if (method === 'fcport.delete') {
          return of(true);
        }
        return of(null);
      });

      await lastValueFrom(
        spectator.service.linkFiberChannelPortsToTarget(fakeTargetId, []),
      );

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('fcport.delete', [1]);
    });

    it('handles 1→1 transition (no change, same port)', async () => {
      const existingPort = { id: 1, port: 'fc0' } as FibreChannelPort;
      jest.spyOn(spectator.inject(ApiService), 'call').mockImplementation((method) => {
        if (method === 'fcport.query') {
          return of([existingPort]);
        }
        return of(null);
      });

      const result = await lastValueFrom(
        spectator.service.linkFiberChannelPortsToTarget(fakeTargetId, [
          { port: 'fc0', host_id: null },
        ]),
      );

      expect(result).toBe(true);
      // Should only call query, no create or delete
      expect(spectator.inject(ApiService).call).toHaveBeenCalledTimes(1);
    });

    it('handles 1→1 transition (change to different port)', async () => {
      const existingPort = { id: 1, port: 'fc0' } as FibreChannelPort;
      jest.spyOn(spectator.inject(ApiService), 'call').mockImplementation((method) => {
        if (method === 'fcport.query') {
          return of([existingPort]);
        }
        if (method === 'fcport.delete') {
          return of(true);
        }
        if (method === 'fcport.create') {
          return of({ id: 2, port: 'fc1' });
        }
        return of(null);
      });

      await lastValueFrom(
        spectator.service.linkFiberChannelPortsToTarget(fakeTargetId, [
          { port: 'fc1', host_id: null },
        ]),
      );

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('fcport.delete', [1]);
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith(
        'fcport.create',
        [{ port: 'fc1', target_id: fakeTargetId }],
      );
    });

    it('handles 1→N transition (add more ports)', async () => {
      const existingPort = { id: 1, port: 'fc0' } as FibreChannelPort;
      jest.spyOn(spectator.inject(ApiService), 'call').mockImplementation((method) => {
        if (method === 'fcport.query') {
          return of([existingPort]);
        }
        if (method === 'fcport.create') {
          return of({ id: 2 });
        }
        return of(null);
      });

      await lastValueFrom(
        spectator.service.linkFiberChannelPortsToTarget(fakeTargetId, [
          { port: 'fc0', host_id: null },
          { port: 'fc1', host_id: null },
          { port: 'fc2', host_id: null },
        ]),
      );

      // Should not delete fc0 (still desired)
      expect(spectator.inject(ApiService).call).not.toHaveBeenCalledWith('fcport.delete', expect.anything());
      // Should create fc1 and fc2
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith(
        'fcport.create',
        [{ port: 'fc1', target_id: fakeTargetId }],
      );
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith(
        'fcport.create',
        [{ port: 'fc2', target_id: fakeTargetId }],
      );
    });

    it('creates virtual port when host_id provided', async () => {
      const host = { id: fakeHostId, alias: 'fc', npiv: 1 } as FibreChannelHost;
      jest.spyOn(spectator.inject(ApiService), 'call').mockImplementation((method) => {
        if (method === 'fcport.query') {
          return of([]);
        }
        if (method === 'fc.fc_host.query') {
          return of([host]);
        }
        if (method === 'fc.fc_host.update') {
          return of({ ...host, npiv: 2 });
        }
        if (method === 'fcport.create') {
          return of({ id: 1 });
        }
        return of(null);
      });

      await lastValueFrom(
        spectator.service.linkFiberChannelPortsToTarget(fakeTargetId, [
          { port: null, host_id: fakeHostId },
        ]),
      );

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith(
        'fc.fc_host.update',
        [fakeHostId, { npiv: 2 }],
      );
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith(
        'fcport.create',
        [{ port: 'fc/2', target_id: fakeTargetId }],
      );
    });

    it('handles mixed desired ports (some existing, some new, some to delete)', async () => {
      const existingPorts = [
        { id: 1, port: 'fc0' },
        { id: 2, port: 'fc1' },
        { id: 3, port: 'fc2' },
      ] as FibreChannelPort[];

      jest.spyOn(spectator.inject(ApiService), 'call').mockImplementation((method) => {
        if (method === 'fcport.query') {
          return of(existingPorts);
        }
        if (method === 'fcport.delete') {
          return of(true);
        }
        if (method === 'fcport.create') {
          return of({ id: 4 });
        }
        return of(null);
      });

      await lastValueFrom(
        spectator.service.linkFiberChannelPortsToTarget(fakeTargetId, [
          { port: 'fc0', host_id: null }, // Keep
          { port: 'fc3', host_id: null }, // Create
          // fc1 and fc2 should be deleted
        ]),
      );

      // Should delete fc1 and fc2
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('fcport.delete', [2]);
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('fcport.delete', [3]);
      // Should create fc3
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith(
        'fcport.create',
        [{ port: 'fc3', target_id: fakeTargetId }],
      );
      // Should not touch fc0
      expect(spectator.inject(ApiService).call).not.toHaveBeenCalledWith('fcport.delete', [1]);
    });
  });
});
