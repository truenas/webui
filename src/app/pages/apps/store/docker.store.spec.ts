import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { DockerConfig } from 'app/enums/docker-config.interface';
import { DockerStatus } from 'app/enums/docker-status.enum';
import { DockerStore } from 'app/pages/apps/store/docker.store';
import { ApiService } from 'app/services/websocket/api.service';

describe('DockerStore', () => {
  let spectator: SpectatorService<DockerStore>;
  const createComponent = createServiceFactory({
    service: DockerStore,
    providers: [
      mockApi([
        mockCall('docker.config', {
          enable_image_updates: true,
          pool: 'pewl',
          nvidia: true,
        } as DockerConfig),
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

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('docker.config');
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('docker.status');

      expect(spectator.service.state()).toEqual({
        dockerConfig: {
          enable_image_updates: true,
          pool: 'pewl',
          nvidia: true,
        },
        isLoading: false,
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

      const mockedApi = spectator.inject(MockApiService);
      jest.resetAllMocks();
      mockedApi.mockCall('docker.config', newDockerConfig);

      spectator.service.reloadDockerConfig().subscribe();

      expect(mockedApi.call).toHaveBeenCalledWith('docker.config');
      expect(spectator.service.state().dockerConfig).toEqual(newDockerConfig);
    });
  });
});
