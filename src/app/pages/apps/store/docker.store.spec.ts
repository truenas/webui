import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { MockWebSocketService } from 'app/core/testing/classes/mock-websocket.service';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { DockerConfig } from 'app/enums/docker-config.interface';
import { DockerStatus } from 'app/enums/docker-status.enum';
import { DockerStore } from 'app/pages/apps/store/docker.store';
import { WebSocketService } from 'app/services/ws.service';

describe('DockerStore', () => {
  let spectator: SpectatorService<DockerStore>;
  const createComponent = createServiceFactory({
    service: DockerStore,
    providers: [
      mockWebSocket([
        mockCall('docker.config', {
          enable_image_updates: true,
          pool: 'pewl',
          nvidia: true,
        } as DockerConfig),
        mockCall('docker.lacks_nvidia_drivers', true),
        mockCall('docker.status', {
          status: DockerStatus.Running,
          description: 'Docker is running',
        }),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  describe('initialize', () => {
    it('loads docker data', () => {
      spectator.service.initialize();

      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('docker.config');
      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('docker.lacks_nvidia_drivers');
      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('docker.status');

      expect(spectator.service.state()).toEqual({
        dockerConfig: {
          enable_image_updates: true,
          nvidia: true,
          pool: 'pewl',
        },
        isLoading: false,
        lacksNvidiaDrivers: true,
        nvidiaDriversInstalled: true,
        statusData: {
          description: 'Docker is running',
          status: DockerStatus.Running,
        },
      });
    });
  });

  describe('reloadDockerConfig', () => {
    it('reloads docker config and updates the state', () => {
      const newDockerConfig = {
        pool: 'new-pool',
        enable_image_updates: false,
      } as DockerConfig;

      const mockWebsocket = spectator.inject(MockWebSocketService);
      jest.resetAllMocks();
      mockWebsocket.mockCall('docker.config', newDockerConfig);

      spectator.service.reloadDockerConfig().subscribe();

      expect(mockWebsocket.call).toHaveBeenCalledWith('docker.config');
      expect(spectator.service.state().dockerConfig).toEqual(newDockerConfig);
    });
  });
});
