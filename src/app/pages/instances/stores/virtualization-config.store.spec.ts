import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { Subject, throwError } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { CollectionChangeType } from 'app/enums/api.enum';
import { VirtualizationGlobalState } from 'app/enums/virtualization.enum';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import { VirtualizationGlobalConfig } from 'app/interfaces/virtualization.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { VirtualizationConfigStore } from 'app/pages/instances/stores/virtualization-config.store';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

describe('VirtualizationConfigStore', () => {
  let spectator: SpectatorService<VirtualizationConfigStore>;
  const configEvent$ = new Subject<ApiEvent<VirtualizationGlobalConfig>>();

  const config: VirtualizationGlobalConfig = {
    pool: 'poolio',
    dataset: 'poolio/.ix-virt',
    state: VirtualizationGlobalState.Initialized,
    bridge: 'br0',
    v4_network: null,
    v6_network: null,
    id: 1,
    storage_pools: ['poolio'],
  };

  const createService = createServiceFactory({
    service: VirtualizationConfigStore,
    providers: [
      mockApi([
        mockCall('virt.global.config', config),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    jest.spyOn(spectator.inject(ApiService), 'subscribe').mockReturnValue(configEvent$);
  });

  it('should have default empty state', () => {
    expect(spectator.service.state()).toEqual({
      isLoading: false,
      config: null,
    });
  });

  it('should load config when initialize is called', () => {
    spectator.service.initialize();

    expect(spectator.inject(ApiService).call).toHaveBeenCalled();
    expect(spectator.service.state()).toEqual({
      isLoading: false,
      config,
    });
  });

  describe('selectors', () => {
    beforeEach(() => spectator.service.initialize());

    it('isLoading - returns isLoading part of the state', () => {
      expect(spectator.service.isLoading()).toBe(false);
    });

    it('config - returns config part of the state', () => {
      expect(spectator.service.config()).toEqual(config);
    });

    it('virtualizationState - returns state from config part of the state', () => {
      expect(spectator.service.virtualizationState()).toBe(VirtualizationGlobalState.Initialized);
    });
  });

  describe('config updates subscription', () => {
    it('subscribes to config updates on first initialize call', () => {
      spectator.service.initialize();

      expect(spectator.inject(ApiService).subscribe).toHaveBeenCalledWith('virt.global.config');
    });

    it('does not create duplicate subscriptions on multiple initialize calls', () => {
      spectator.service.initialize();
      spectator.service.initialize();

      expect(spectator.inject(ApiService).subscribe).toHaveBeenCalledTimes(1);
    });

    it('updates config when subscription emits new data', () => {
      spectator.service.initialize();

      const updatedConfig: VirtualizationGlobalConfig = {
        ...config,
        state: VirtualizationGlobalState.NoPool,
        pool: null,
      };

      configEvent$.next({
        collection: 'virt.global.config',
        id: '1',
        msg: CollectionChangeType.Changed,
        fields: updatedConfig,
      });

      expect(spectator.service.config()).toEqual(updatedConfig);
      expect(spectator.service.virtualizationState()).toBe(VirtualizationGlobalState.NoPool);
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
    it('sets isLoading to true while fetching config', () => {
      const delayedResponse$ = new Subject<VirtualizationGlobalConfig>();
      jest.spyOn(spectator.inject(ApiService), 'call').mockReturnValue(delayedResponse$);

      spectator.service.initialize();

      expect(spectator.service.isLoading()).toBe(true);

      delayedResponse$.next(config);

      expect(spectator.service.isLoading()).toBe(false);
    });

    it('sets isLoading to false after config is loaded', () => {
      spectator.service.initialize();

      expect(spectator.service.isLoading()).toBe(false);
      expect(spectator.service.config()).toEqual(config);
    });
  });
});
