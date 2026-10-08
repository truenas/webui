import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { TranslateService } from '@ngx-translate/core';
import { EventUnion } from '@truenas/api-client';
import { Observable, of } from 'rxjs';
import { MockTypedApiService } from 'app/core/testing/classes/mock-typed-api.service';
import { mockTypedApi, mockTypedCall, settleTypedApi } from 'app/core/testing/utils/mock-typed-api.utils';
import { DockerStatus } from 'app/enums/docker-status.enum';
import { DockerConfig } from 'app/interfaces/docker-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';
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
          jobDialog: jest.fn(() => ({ afterClosed: () => of(null) })),
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

  describe('setDockerPool', () => {
    it('sets the apps pool in a job dialog', async () => {
      spectator.service.setDockerPool('pewl').subscribe();
      await settleTypedApi();

      expect(spectator.inject(TypedApiService).job).toHaveBeenCalledWith('docker.update', [{ pool: 'pewl' }]);
      expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalledWith(
        expect.anything(),
        { title: 'Configuring apps' },
      );
    });

    it('asks to migrate apps when requested', () => {
      spectator.service.setDockerPool('pewl', true).subscribe();

      expect(spectator.inject(TypedApiService).job).toHaveBeenCalledWith(
        'docker.update',
        [{ pool: 'pewl', migrate_applications: true }],
      );
    });
  });

  describe('dockerStatusEventUpdates', () => {
    it('stores the status a docker.state change carries and ignores frames without one', async () => {
      spectator.service.initialize();
      spectator.service.dockerStatusEventUpdates().subscribe();
      await settleTypedApi();

      const mockedApi = spectator.inject(MockTypedApiService);
      mockedApi.emitEvent('docker.state', { msg: 'added', id: 1 });
      expect(spectator.service.state().statusData).toEqual({
        status: DockerStatus.Running, description: 'Docker is running',
      });

      mockedApi.emitEvent('docker.state', {
        msg: 'changed', id: 1, fields: { status: DockerStatus.Stopped, description: '' },
      } as EventUnion<WebUiApiDirectory, 'docker.state'>);
      expect(spectator.service.state().statusData).toEqual({ status: DockerStatus.Stopped, description: '' });
    });
  });

  describe('dockerConfigEventUpdates', () => {
    it('stores the config a finished docker.update job returns, ignoring other jobs', async () => {
      spectator.service.dockerConfigEventUpdates().subscribe();
      await settleTypedApi();

      const mockedApi = spectator.inject(MockTypedApiService);
      const job = (method: string, result: unknown): EventUnion<WebUiApiDirectory, 'core.get_jobs'> => ({
        msg: 'changed', id: 1, fields: { id: 1, method, result },
      } as EventUnion<WebUiApiDirectory, 'core.get_jobs'>);

      mockedApi.emitEvent('core.get_jobs', job('docker.update', null));
      mockedApi.emitEvent('core.get_jobs', job('pool.scrub', { pool: 'wrong' }));
      expect(spectator.service.state().dockerConfig).toBeNull();

      mockedApi.emitEvent('core.get_jobs', job('docker.update', { pool: 'new-pool' }));
      expect(spectator.service.state().dockerConfig).toEqual({ pool: 'new-pool' });
    });
  });
});
