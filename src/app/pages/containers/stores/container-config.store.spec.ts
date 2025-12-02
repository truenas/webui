import { fakeAsync, flush } from '@angular/core/testing';
import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { of, Subject, throwError } from 'rxjs';
import { CollectionChangeType } from 'app/enums/api.enum';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import { ContainerGlobalConfig } from 'app/interfaces/container.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { ContainerConfigStore } from 'app/pages/containers/stores/container-config.store';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

describe('ContainerConfigStore', () => {
  let spectator: SpectatorService<ContainerConfigStore>;
  const configEvent$ = new Subject<ApiEvent<ContainerGlobalConfig>>();
  const config: ContainerGlobalConfig = {
    bridge: 'br0',
    v4_network: null,
    v6_network: null,
  } as ContainerGlobalConfig;

  const mockApiService = {
    call: jest.fn(() => of(config)),
    subscribe: jest.fn(() => configEvent$),
  };

  const createService = createServiceFactory({
    service: ContainerConfigStore,
    providers: [
      mockProvider(ApiService, mockApiService),
    ],
  });

  beforeEach(() => {
    mockApiService.call.mockClear();
    mockApiService.call.mockReturnValue(of(config));
    spectator = createService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should have default empty state', () => {
    expect(spectator.service.state()).toEqual({
      isLoading: false,
      config: null,
    });
  });

  it('should load config when initialize is called', fakeAsync(() => {
    spectator.service.initialize();
    flush();

    expect(spectator.inject(ApiService).call).toHaveBeenCalled();
    expect(spectator.service.state()).toEqual({
      isLoading: false,
      config,
    });
  }));

  describe('selectors', () => {
    beforeEach(fakeAsync(() => {
      spectator.service.initialize();
      flush();
    }));

    it('isLoading - returns isLoading part of the state', () => {
      expect(spectator.service.isLoading()).toBe(false);
    });

    it('config - returns config part of the state', () => {
      expect(spectator.service.config()).toEqual(config);
    });
  });

  describe('config updates subscription', () => {
    it('subscribes to config updates on first initialize call', () => {
      spectator.service.initialize();

      expect(spectator.inject(ApiService).subscribe).toHaveBeenCalledWith('lxc.config');
    });

    it('does not create duplicate subscriptions on multiple initialize calls', () => {
      spectator.service.initialize();
      spectator.service.initialize();

      expect(spectator.inject(ApiService).subscribe).toHaveBeenCalledTimes(1);
    });

    it('updates config when subscription emits new data', () => {
      spectator.service.initialize();

      const updatedConfig: ContainerGlobalConfig = {
        ...config,
        bridge: 'br1',
      };

      configEvent$.next({
        collection: 'lxc.config',
        id: '1',
        msg: CollectionChangeType.Changed,
        fields: updatedConfig,
      });

      expect(spectator.service.config()).toEqual(updatedConfig);
    });
  });

  describe('error handling', () => {
    it('sets isLoading to false on API error', () => {
      jest.spyOn(spectator.inject(ApiService), 'call').mockReturnValue(
        throwError(() => new Error('API error')),
      );

      spectator.service.initialize();

      expect(spectator.service.isLoading()).toBe(false);
      expect(spectator.service.config()).toBeNull();
    });

    it('shows error modal when API call fails', () => {
      const error = new Error('API error');
      jest.spyOn(spectator.inject(ApiService), 'call').mockReturnValue(
        throwError(() => error),
      );
      const errorHandler = spectator.inject(ErrorHandlerService);
      jest.spyOn(errorHandler, 'showErrorModal');

      spectator.service.initialize();

      expect(errorHandler.showErrorModal).toHaveBeenCalledWith(error);
    });
  });

  describe('loading state', () => {
    it('sets isLoading to false after config is loaded', fakeAsync(() => {
      spectator.service.initialize();
      flush();

      expect(spectator.service.isLoading()).toBe(false);
      expect(spectator.service.config()).toEqual(config);
    }));

    it('sets isLoading to true while fetching config', () => {
      const delayedResponse$ = new Subject<ContainerGlobalConfig>();
      jest.spyOn(spectator.inject(ApiService), 'call').mockReturnValue(delayedResponse$);

      spectator.service.initialize();

      expect(spectator.service.isLoading()).toBe(true);

      delayedResponse$.next(config);

      expect(spectator.service.isLoading()).toBe(false);
    });
  });
});
