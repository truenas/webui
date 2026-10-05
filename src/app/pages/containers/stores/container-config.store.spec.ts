import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { Subject, throwError } from 'rxjs';
import { MockTypedApiService } from 'app/core/testing/classes/mock-typed-api.service';
import {
  mockTypedApi, mockTypedCall, settleTypedApi,
} from 'app/core/testing/utils/mock-typed-api.utils';
import { ContainerGlobalConfig } from 'app/interfaces/container.interface';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import { ContainerConfigStore } from 'app/pages/containers/stores/container-config.store';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

describe('ContainerConfigStore', () => {
  let spectator: SpectatorService<ContainerConfigStore>;
  const config = {
    bridge: 'br0',
    v4_network: '10.0.0.1/24',
    v6_network: 'fd00::1/64',
  } as ContainerGlobalConfig;

  const createService = createServiceFactory({
    service: ContainerConfigStore,
    providers: [
      mockTypedApi([
        mockTypedCall('lxc.config', config),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('should have default empty state', () => {
    expect(spectator.service.state()).toEqual({
      isLoading: false,
      config: null,
    });
  });

  it('should load config when initialize is called', async () => {
    spectator.service.initialize();
    await settleTypedApi();

    expect(spectator.inject(TypedApiService).call).toHaveBeenCalledWith('lxc.config');
    expect(spectator.service.state()).toEqual({
      isLoading: false,
      config,
    });
  });

  it('should not make duplicate API calls when initialize is called while loading', async () => {
    spectator.service.patchState({ isLoading: true });
    spectator.service.initialize();
    await settleTypedApi();

    expect(spectator.inject(TypedApiService).call).not.toHaveBeenCalledWith('lxc.config');
  });

  describe('selectors', () => {
    beforeEach(async () => {
      spectator.service.initialize();
      await settleTypedApi();
    });

    it('isLoading - returns isLoading part of the state', () => {
      expect(spectator.service.isLoading()).toBe(false);
    });

    it('config - returns config part of the state', () => {
      expect(spectator.service.config()).toEqual(config);
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      spectator.inject(MockTypedApiService).mockCallError('lxc.config');
      jest.spyOn(spectator.inject(ErrorHandlerService), 'showErrorModal').mockImplementation();
    });

    it('sets isLoading to false on API error', async () => {
      spectator.service.initialize();
      await settleTypedApi();

      expect(spectator.service.isLoading()).toBe(false);
      expect(spectator.service.config()).toBeNull();
    });

    it('shows error modal when API call fails', async () => {
      const error = new Error('API error');
      jest.spyOn(spectator.inject(TypedApiService), 'call').mockReturnValue(throwError(() => error));
      const errorHandler = spectator.inject(ErrorHandlerService);

      spectator.service.initialize();
      await settleTypedApi();

      expect(errorHandler.showErrorModal).toHaveBeenCalledWith(error);
    });
  });

  describe('loading state', () => {
    it('sets isLoading to true while fetching config', () => {
      const delayedResponse$ = new Subject<ContainerGlobalConfig>();
      jest.spyOn(spectator.inject(TypedApiService), 'call').mockReturnValue(delayedResponse$);

      spectator.service.initialize();

      expect(spectator.service.isLoading()).toBe(true);

      delayedResponse$.next(config);

      expect(spectator.service.isLoading()).toBe(false);
    });
  });
});
