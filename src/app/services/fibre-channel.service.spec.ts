import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { lastValueFrom } from 'rxjs';
import { MockTypedApiService } from 'app/core/testing/classes/mock-typed-api.service';
import { mockTypedApi, mockTypedCall, mockTypedQuery } from 'app/core/testing/utils/mock-typed-api.utils';
import { FcPortFormValue } from 'app/interfaces/fibre-channel.interface';
import { WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import { FibreChannelService } from 'app/services/fibre-channel.service';

type FcPort = WebUiQueryEntity<'fcport.query'>;
type FcHost = WebUiQueryEntity<'fc.fc_host.query'>;

describe('FibreChannelService', () => {
  let spectator: SpectatorService<FibreChannelService>;
  const fakeTargetId = 11;
  const fakeHostId = 22;
  const fakePortId = 33;

  const createService = createServiceFactory({
    service: FibreChannelService,
    providers: [
      mockTypedApi([
        mockTypedQuery('fcport.query', [{ id: fakePortId, port: 'fc/2' }] as FcPort[]),
        mockTypedCall('fcport.create', null),
        mockTypedCall('fcport.update', null),
        mockTypedCall('fcport.delete', null),
        mockTypedQuery('fc.fc_host.query', [{ id: fakeHostId, alias: 'fc', npiv: 1 }] as FcHost[]),
        mockTypedCall('fc.fc_host.update', null),
      ]),
    ],
  });

  beforeEach(() => spectator = createService());

  describe('loadTargetPorts', () => {
    it('returns empty array when target has no ports', async () => {
      spectator.inject(MockTypedApiService).mockQuery('fcport.query', []);

      const result = await lastValueFrom(spectator.service.loadTargetPorts(fakeTargetId));

      expect(result).toEqual([]);
      expect(spectator.inject(TypedApiService).query).toHaveBeenCalledWith(
        'fcport.query',
        [['target.id', '=', fakeTargetId]],
      );
    });

    it('returns array with single port', async () => {
      const port = { id: 1, port: 'fc0' } as FcPort;
      spectator.inject(MockTypedApiService).mockQuery('fcport.query', [port]);

      const result = await lastValueFrom(spectator.service.loadTargetPorts(fakeTargetId));

      expect(result).toEqual([port]);
    });

    it('returns array with multiple ports', async () => {
      const ports = [
        { id: 1, port: 'fc0' },
        { id: 2, port: 'fc1' },
        { id: 3, port: 'fc0/1' },
      ] as FcPort[];
      spectator.inject(MockTypedApiService).mockQuery('fcport.query', ports);

      const result = await lastValueFrom(spectator.service.loadTargetPorts(fakeTargetId));

      expect(result).toEqual(ports);
    });
  });

  describe('validatePhysicalPortUniqueness', () => {
    it('returns valid when no ports provided', () => {
      const result = spectator.service.validatePhysicalPortUniqueness([]);

      expect(result).toEqual({ valid: true, duplicates: [] });
    });

    it('returns valid when all ports have null port string', () => {
      const ports: FcPortFormValue[] = [
        { port: null, host_id: 1 },
        { port: null, host_id: 2 },
      ];

      const result = spectator.service.validatePhysicalPortUniqueness(ports);

      expect(result).toEqual({ valid: true, duplicates: [] });
    });

    it('returns valid when ports use different physical ports', () => {
      const ports: FcPortFormValue[] = [
        { port: 'fc0', host_id: null },
        { port: 'fc1', host_id: null },
        { port: 'fc2/1', host_id: null },
      ];

      const result = spectator.service.validatePhysicalPortUniqueness(ports);

      expect(result).toEqual({ valid: true, duplicates: [] });
    });

    it('returns invalid when same physical port used twice (basic)', () => {
      const ports: FcPortFormValue[] = [
        { port: 'fc0', host_id: null },
        { port: 'fc0/1', host_id: null },
      ];

      const result = spectator.service.validatePhysicalPortUniqueness(ports);

      expect(result).toEqual({ valid: false, duplicates: ['fc0'] });
    });

    it('returns invalid when same physical port used twice (NPIV ports)', () => {
      const ports: FcPortFormValue[] = [
        { port: 'fc1/2', host_id: null },
        { port: 'fc1/3', host_id: null },
      ];

      const result = spectator.service.validatePhysicalPortUniqueness(ports);

      expect(result).toEqual({ valid: false, duplicates: ['fc1'] });
    });

    it('returns invalid with multiple duplicate ports', () => {
      const ports: FcPortFormValue[] = [
        { port: 'fc0', host_id: null },
        { port: 'fc0/1', host_id: null },
        { port: 'fc1/2', host_id: null },
        { port: 'fc1/3', host_id: null },
      ];

      const result = spectator.service.validatePhysicalPortUniqueness(ports);

      expect(result.valid).toBe(false);
      expect(result.duplicates).toContain('fc0');
      expect(result.duplicates).toContain('fc1');
    });

    it('returns invalid when mixing host_id and port on same physical port', () => {
      const hosts = [
        { id: 1, alias: 'fc0' },
        { id: 2, alias: 'fc1' },
      ];
      const ports: FcPortFormValue[] = [
        { port: null, host_id: 1 }, // New virtual port on fc0
        { port: 'fc0/1', host_id: null }, // Existing port on fc0
      ];

      const result = spectator.service.validatePhysicalPortUniqueness(ports, hosts);

      expect(result).toEqual({ valid: false, duplicates: ['fc0'] });
    });

    it('returns invalid when using multiple host_ids for same physical port', () => {
      const hosts = [
        { id: 1, alias: 'fc0' },
        { id: 2, alias: 'fc1' },
      ];
      const ports: FcPortFormValue[] = [
        { port: null, host_id: 1 }, // New virtual port on fc0
        { port: null, host_id: 1 }, // Another new virtual port on fc0
      ];

      const result = spectator.service.validatePhysicalPortUniqueness(ports, hosts);

      expect(result).toEqual({ valid: false, duplicates: ['fc0'] });
    });

    it('returns valid when mixing host_id and port on different physical ports', () => {
      const hosts = [
        { id: 1, alias: 'fc0' },
        { id: 2, alias: 'fc1' },
      ];
      const ports: FcPortFormValue[] = [
        { port: null, host_id: 1 }, // New virtual port on fc0
        { port: 'fc1/1', host_id: null }, // Existing port on fc1
      ];

      const result = spectator.service.validatePhysicalPortUniqueness(ports, hosts);

      expect(result).toEqual({ valid: true, duplicates: [] });
    });

    it('handles missing host_id gracefully', () => {
      const hosts = [
        { id: 1, alias: 'fc0' },
      ];
      const ports: FcPortFormValue[] = [
        { port: null, host_id: 999 }, // host_id not in hosts array
        { port: 'fc1', host_id: null },
      ];

      const result = spectator.service.validatePhysicalPortUniqueness(ports, hosts);

      // Should skip the entry with unknown host_id and only count fc1
      expect(result).toEqual({ valid: true, duplicates: [] });
    });
  });

  describe('linkFiberChannelPortsToTarget', () => {
    it('handles 0→0 transition (no existing, no desired)', async () => {
      spectator.inject(MockTypedApiService).mockQuery('fcport.query', []);

      const result = await lastValueFrom(
        spectator.service.linkFiberChannelPortsToTarget(fakeTargetId, []),
      );

      expect(result).toBe(true);
      expect(spectator.inject(TypedApiService).query).toHaveBeenCalledWith(
        'fcport.query',
        [['target.id', '=', fakeTargetId]],
      );
      // Should not call create or delete
      expect(spectator.inject(TypedApiService).call).not.toHaveBeenCalled();
    });

    it('handles 0→1 transition (create single port)', async () => {
      spectator.inject(MockTypedApiService).mockQuery('fcport.query', []);

      await lastValueFrom(
        spectator.service.linkFiberChannelPortsToTarget(fakeTargetId, [
          { port: 'fc0', host_id: null },
        ]),
      );

      expect(spectator.inject(TypedApiService).call).toHaveBeenCalledWith(
        'fcport.create',
        [{ port: 'fc0', target_id: fakeTargetId }],
      );
    });

    it('handles 1→0 transition (delete existing port)', async () => {
      const existingPort = { id: 1, port: 'fc0' } as FcPort;
      spectator.inject(MockTypedApiService).mockQuery('fcport.query', [existingPort]);

      await lastValueFrom(
        spectator.service.linkFiberChannelPortsToTarget(fakeTargetId, []),
      );

      expect(spectator.inject(TypedApiService).call).toHaveBeenCalledWith('fcport.delete', [1]);
    });

    it('handles 1→1 transition (no change, same port)', async () => {
      const existingPort = { id: 1, port: 'fc0' } as FcPort;
      spectator.inject(MockTypedApiService).mockQuery('fcport.query', [existingPort]);

      const result = await lastValueFrom(
        spectator.service.linkFiberChannelPortsToTarget(fakeTargetId, [
          { port: 'fc0', host_id: null },
        ]),
      );

      expect(result).toBe(true);
      // Should only call query, no create or delete
      expect(spectator.inject(TypedApiService).call).not.toHaveBeenCalled();
    });

    it('handles 1→1 transition (change to different port)', async () => {
      const existingPort = { id: 1, port: 'fc0' } as FcPort;
      spectator.inject(MockTypedApiService).mockQuery('fcport.query', [existingPort]);

      await lastValueFrom(
        spectator.service.linkFiberChannelPortsToTarget(fakeTargetId, [
          { port: 'fc1', host_id: null },
        ]),
      );

      expect(spectator.inject(TypedApiService).call).toHaveBeenCalledWith('fcport.delete', [1]);
      expect(spectator.inject(TypedApiService).call).toHaveBeenCalledWith(
        'fcport.create',
        [{ port: 'fc1', target_id: fakeTargetId }],
      );
    });

    it('handles 1→N transition (add more ports)', async () => {
      const existingPort = { id: 1, port: 'fc0' } as FcPort;
      spectator.inject(MockTypedApiService).mockQuery('fcport.query', [existingPort]);

      await lastValueFrom(
        spectator.service.linkFiberChannelPortsToTarget(fakeTargetId, [
          { port: 'fc0', host_id: null },
          { port: 'fc1', host_id: null },
          { port: 'fc2', host_id: null },
        ]),
      );

      // Should not delete fc0 (still desired)
      expect(spectator.inject(TypedApiService).call).not.toHaveBeenCalledWith('fcport.delete', expect.anything());
      // Should create fc1 and fc2
      expect(spectator.inject(TypedApiService).call).toHaveBeenCalledWith(
        'fcport.create',
        [{ port: 'fc1', target_id: fakeTargetId }],
      );
      expect(spectator.inject(TypedApiService).call).toHaveBeenCalledWith(
        'fcport.create',
        [{ port: 'fc2', target_id: fakeTargetId }],
      );
    });

    it('creates virtual port when host_id provided', async () => {
      const host = { id: fakeHostId, alias: 'fc', npiv: 1 } as FcHost;
      spectator.inject(MockTypedApiService).mockQuery('fcport.query', []);
      spectator.inject(MockTypedApiService).mockQuery('fc.fc_host.query', [host]);

      await lastValueFrom(
        spectator.service.linkFiberChannelPortsToTarget(fakeTargetId, [
          { port: null, host_id: fakeHostId },
        ]),
      );

      expect(spectator.inject(TypedApiService).call).toHaveBeenCalledWith(
        'fc.fc_host.update',
        [fakeHostId, { npiv: 2 }],
      );
      expect(spectator.inject(TypedApiService).call).toHaveBeenCalledWith(
        'fcport.create',
        [{ port: 'fc/2', target_id: fakeTargetId }],
      );
    });

    it('handles mixed desired ports (some existing, some new, some to delete)', async () => {
      const existingPorts = [
        { id: 1, port: 'fc0' },
        { id: 2, port: 'fc1' },
        { id: 3, port: 'fc2' },
      ] as FcPort[];

      spectator.inject(MockTypedApiService).mockQuery('fcport.query', existingPorts);

      await lastValueFrom(
        spectator.service.linkFiberChannelPortsToTarget(fakeTargetId, [
          { port: 'fc0', host_id: null }, // Keep
          { port: 'fc3', host_id: null }, // Create
          // fc1 and fc2 should be deleted
        ]),
      );

      // Should delete fc1 and fc2
      expect(spectator.inject(TypedApiService).call).toHaveBeenCalledWith('fcport.delete', [2]);
      expect(spectator.inject(TypedApiService).call).toHaveBeenCalledWith('fcport.delete', [3]);
      // Should create fc3
      expect(spectator.inject(TypedApiService).call).toHaveBeenCalledWith(
        'fcport.create',
        [{ port: 'fc3', target_id: fakeTargetId }],
      );
      // Should not touch fc0
      expect(spectator.inject(TypedApiService).call).not.toHaveBeenCalledWith('fcport.delete', [1]);
    });
  });
});
