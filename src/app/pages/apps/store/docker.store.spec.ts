import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { MockTypedApiService } from 'app/core/testing/classes/mock-typed-api.service';
import { mockTypedApi, mockTypedCall, settleTypedApi } from 'app/core/testing/utils/mock-typed-api.utils';
import { DockerStatus } from 'app/enums/docker-status.enum';
import { DockerConfig } from 'app/interfaces/docker-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import { DockerStore } from 'app/pages/apps/store/docker.store';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

describe('DockerStore', () => {
  let spectator: SpectatorService<DockerStore>;
  const createComponent = createServiceFactory({
    service: DockerStore,
    providers: [
      mockTypedApi([
        mockTypedCall('docker.config', {
          enable_image_updates: true,
          pool: 'pewl',
        } as DockerConfig),
        mockTypedCall('docker.status', {
          status: DockerStatus.Running,
          description: 'Docker is running',
        }),
      ]),
      {
        provide: ErrorHandlerService,
        useValue: {
          withErrorHandler: <T>() => (source$: Observable<T>) => source$,
        },
      },
      {
        provide: DialogService,
        useValue: {
          jobDialog: jest.fn(),
        },
      },
      {
        provide: TranslateService,
        useValue: {
          instant: jest.fn((key: string) => key),
        },
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  describe('initialize', () => {
    it('loads docker data', async () => {
      spectator.service.initialize();
      await settleTypedApi();

      expect(spectator.inject(TypedApiService).call).toHaveBeenCalledWith('docker.config');
      expect(spectator.inject(TypedApiService).call).toHaveBeenCalledWith('docker.status');

      expect(spectator.service.state()).toEqual({
        dockerConfig: {
          enable_image_updates: true,
          pool: 'pewl',
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
    it('reloads docker config and updates the state', async () => {
      const newDockerConfig = {
        pool: 'new-pool',
        enable_image_updates: false,
      } as DockerConfig;

      const mockedApi = spectator.inject(MockTypedApiService);
      mockedApi.mockCall('docker.config', newDockerConfig);

      spectator.service.reloadDockerConfig().subscribe();
      await settleTypedApi();

      expect(mockedApi.call).toHaveBeenCalledWith('docker.config');
      expect(spectator.service.state().dockerConfig).toEqual(newDockerConfig);
    });
  });
});
