import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { Subject, throwError } from 'rxjs';
import { mockApi, mockQuery, settleApi } from 'app/core/testing/utils/mock-api.utils';
import { NetworkInterface } from 'app/interfaces/network-interface.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';
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
      mockApi([
        mockQuery('interface.query', interfaces as unknown as WebUiQueryEntity<'interface.query'>[]),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('should have default empty state', () => {
    expect(spectator.service.interfaces()).toEqual([]);
    expect(spectator.service.isLoading()).toBe(false);
  });

  it('should load interfaces when loadInterfaces is called', async () => {
    spectator.service.loadInterfaces();
    await settleApi();

    expect(spectator.inject(ApiService).query).toHaveBeenCalledWith('interface.query');
    expect(spectator.service.interfaces()).toEqual(interfaces);
    expect(spectator.service.isLoading()).toBe(false);
  });

  describe('loading state', () => {
    it('sets isLoading to true while fetching interfaces', () => {
      const delayedResponse$ = new Subject<NetworkInterface[]>();
      jest.spyOn(spectator.inject(ApiService), 'query').mockReturnValue(delayedResponse$);

      spectator.service.loadInterfaces();

      expect(spectator.service.isLoading()).toBe(true);

      delayedResponse$.next(interfaces);
      delayedResponse$.complete();

      expect(spectator.service.isLoading()).toBe(false);
    });

    it('sets isLoading to false after interfaces are loaded', async () => {
      spectator.service.loadInterfaces();
      await settleApi();

      expect(spectator.service.isLoading()).toBe(false);
      expect(spectator.service.interfaces()).toEqual(interfaces);
    });
  });

  describe('error handling', () => {
    it('shows error modal when loadInterfaces fails', () => {
      const error = new Error('Failed to load interfaces');
      jest.spyOn(spectator.inject(ApiService), 'query').mockReturnValue(
        throwError(() => error),
      );
      const errorHandler = spectator.inject(ErrorHandlerService);
      jest.spyOn(errorHandler, 'showErrorModal');

      spectator.service.loadInterfaces();

      expect(errorHandler.showErrorModal).toHaveBeenCalledWith(error);
    });

    it('clears isLoading when the API fails, so the card does not spin forever', () => {
      const delayedResponse$ = new Subject<NetworkInterface[]>();
      jest.spyOn(spectator.inject(ApiService), 'query').mockReturnValue(delayedResponse$);

      spectator.service.loadInterfaces();
      expect(spectator.service.isLoading()).toBe(true);

      delayedResponse$.error(new Error('API error'));

      expect(spectator.service.isLoading()).toBe(false);
    });

    it('still loads after an earlier load failed', async () => {
      jest.spyOn(spectator.inject(ApiService), 'query').mockReturnValueOnce(throwError(() => new Error('API error')));
      spectator.service.loadInterfaces();

      spectator.service.loadInterfaces();
      await settleApi();

      expect(spectator.service.interfaces()).toEqual(interfaces);
    });
  });
});
