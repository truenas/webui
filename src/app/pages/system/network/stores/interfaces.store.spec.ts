import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { Subject, throwError } from 'rxjs';
import { mockTypedApi, mockTypedQuery, settleTypedApi } from 'app/core/testing/utils/mock-typed-api.utils';
import { NetworkInterface } from 'app/interfaces/network-interface.interface';
import { WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import { InterfacesStore } from 'app/pages/system/network/stores/interfaces.store';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

describe('InterfacesStore', () => {
  let spectator: SpectatorService<InterfacesStore>;

  const interfaces = [
    { id: 'eth0', name: 'eth0' },
    { id: 'eth1', name: 'eth1' },
  ] as NetworkInterface[];

  const createService = createServiceFactory({
    service: InterfacesStore,
    providers: [
      mockTypedApi([
        mockTypedQuery('interface.query', interfaces as unknown as WebUiQueryEntity<'interface.query'>[]),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('should have default empty state', () => {
    expect(spectator.service.state()).toEqual({
      interfaces: [],
      isLoading: false,
    });
  });

  it('should load interfaces when loadInterfaces is called', async () => {
    spectator.service.loadInterfaces();
    await settleTypedApi();

    expect(spectator.inject(TypedApiService).query).toHaveBeenCalledWith('interface.query');
    expect(spectator.service.state()).toEqual({
      interfaces,
      isLoading: false,
    });
  });

  describe('loading state', () => {
    it('sets isLoading to true while fetching interfaces', () => {
      const delayedResponse$ = new Subject<NetworkInterface[]>();
      jest.spyOn(spectator.inject(TypedApiService), 'query').mockReturnValue(delayedResponse$);

      spectator.service.loadInterfaces();

      expect(spectator.service.state().isLoading).toBe(true);

      delayedResponse$.next(interfaces);
      delayedResponse$.complete();

      expect(spectator.service.state().isLoading).toBe(false);
    });

    it('sets isLoading to false after interfaces are loaded', async () => {
      spectator.service.loadInterfaces();
      await settleTypedApi();

      expect(spectator.service.state().isLoading).toBe(false);
      expect(spectator.service.state().interfaces).toEqual(interfaces);
    });
  });

  describe('error handling', () => {
    it('shows error modal when loadInterfaces fails', () => {
      const error = new Error('Failed to load interfaces');
      jest.spyOn(spectator.inject(TypedApiService), 'query').mockReturnValue(
        throwError(() => error),
      );
      const errorHandler = spectator.inject(ErrorHandlerService);
      jest.spyOn(errorHandler, 'showErrorModal');

      spectator.service.loadInterfaces();

      expect(errorHandler.showErrorModal).toHaveBeenCalledWith(error);
    });

    it('keeps isLoading state when API error occurs without completion', () => {
      const delayedResponse$ = new Subject<NetworkInterface[]>();
      jest.spyOn(spectator.inject(TypedApiService), 'query').mockReturnValue(delayedResponse$);

      spectator.service.loadInterfaces();
      expect(spectator.service.state().isLoading).toBe(true);

      delayedResponse$.error(new Error('API error'));

      // isLoading remains true because complete callback is not called on error
      expect(spectator.service.state().isLoading).toBe(true);
    });
  });
});
