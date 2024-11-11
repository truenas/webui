import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { VirtualizationInstancesStore } from 'app/pages/virtualization/stores/virtualization-instances.store';
import { WebSocketService } from 'app/services/ws.service';

describe('VirtualizationInstancesStore', () => {
  let spectator: SpectatorService<VirtualizationInstancesStore>;

  const createService = createServiceFactory({
    service: VirtualizationInstancesStore,
    providers: [
      mockWebSocket([
        mockCall('virt.instance.query', []),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('should have default empty state', () => {
    expect(spectator.service.stateAsSignal()).toEqual({
      isLoading: false,
      instances: [],
      selectedInstance: null,
    });
  });

  it('should load instances when initialize is called', () => {
    spectator.service.initialize();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalled();
    expect(spectator.service.stateAsSignal()).toEqual({
      isLoading: false,
      instances: [],
      selectedInstance: null,
    });
  });

  describe('selectors', () => {
    beforeEach(() => spectator.service.initialize());

    it('isLoading - returns isLoading part of the state', () => {
      expect(spectator.service.isLoading()).toBe(false);
    });

    it('instances - returns instances part of the state', () => {
      expect(spectator.service.instances()).toEqual([]);
    });

    it('selectedInstance - returns selected instance from the state', () => {
      expect(spectator.service.selectedInstance()).toBeNull();
    });
  });
});
