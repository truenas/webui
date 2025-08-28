import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { MockEnclosureScenario } from 'app/core/testing/mock-enclosure/enums/mock-enclosure.enum';
import { MockEnclosureConfig } from 'app/core/testing/mock-enclosure/interfaces/mock-enclosure.interface';
import { EnclosureModel } from 'app/enums/enclosure-model.enum';
import { MockConfig } from 'app/modules/websocket-debug-panel/interfaces/mock-config.interface';
import { addMockConfig, updateMockConfig } from 'app/modules/websocket-debug-panel/store/websocket-debug.actions';
import { selectEnclosureMockConfig, selectMockConfigs } from 'app/modules/websocket-debug-panel/store/websocket-debug.selectors';
import { EnclosureMockService } from './enclosure-mock.service';

describe('EnclosureMockService - Real-time Updates', () => {
  let spectator: SpectatorService<EnclosureMockService>;
  let store$: MockStore;

  const createService = createServiceFactory({
    service: EnclosureMockService,
    providers: [
      provideMockStore({
        selectors: [
          {
            selector: selectEnclosureMockConfig,
            value: {
              enabled: false,
              controllerModel: null,
              expansionModels: [],
              scenario: MockEnclosureScenario.FillSomeSlots,
            } as MockEnclosureConfig,
          },
          {
            selector: selectMockConfigs,
            value: [] as MockConfig[],
          },
        ],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    store$ = spectator.inject(MockStore);
    jest.spyOn(store$, 'dispatch');
  });

  describe('Real-time Mock Response Updates', () => {
    it('should update mock responses immediately when configuration changes', () => {
      // Initial state - mocking disabled
      expect(store$.dispatch).not.toHaveBeenCalled();

      // Enable mocking with a configuration
      const enabledConfig: MockEnclosureConfig = {
        enabled: true,
        controllerModel: EnclosureModel.M40,
        expansionModels: [EnclosureModel.Es24F],
        scenario: MockEnclosureScenario.FillSomeSlots,
      };

      store$.overrideSelector(selectEnclosureMockConfig, enabledConfig);
      store$.overrideSelector(selectMockConfigs, []);
      store$.refreshState();

      // Verify mock configs are created immediately
      expect(store$.dispatch).toHaveBeenCalledWith(
        addMockConfig({
          config: expect.objectContaining({
            id: 'enclosure-mock-dashboard',
            enabled: true,
            methodName: 'webui.enclosure.dashboard',
          }),
        }),
      );

      expect(store$.dispatch).toHaveBeenCalledWith(
        addMockConfig({
          config: expect.objectContaining({
            id: 'enclosure-mock-is-ix-hardware',
            enabled: true,
            methodName: 'truenas.is_ix_hardware',
          }),
        }),
      );

      jest.clearAllMocks();

      // Change scenario - should update responses immediately
      const updatedConfig: MockEnclosureConfig = {
        ...enabledConfig,
        scenario: MockEnclosureScenario.FillAllSlots,
      };

      // Simulate existing configs
      const existingConfigs: MockConfig[] = [
        {
          id: 'enclosure-mock-dashboard',
          enabled: true,
          methodName: 'webui.enclosure.dashboard',
          response: { type: 'success', result: [] },
        },
        {
          id: 'enclosure-mock-is-ix-hardware',
          enabled: true,
          methodName: 'truenas.is_ix_hardware',
          response: { type: 'success', result: true },
        },
      ];

      store$.overrideSelector(selectEnclosureMockConfig, updatedConfig);
      store$.overrideSelector(selectMockConfigs, existingConfigs);
      store$.refreshState();

      // Verify updates are dispatched immediately
      expect(store$.dispatch).toHaveBeenCalledWith(
        updateMockConfig({
          config: expect.objectContaining({
            id: 'enclosure-mock-dashboard',
            enabled: true,
            methodName: 'webui.enclosure.dashboard',
          }),
        }),
      );
    });

    it('should handle rapid configuration changes without reload', () => {
      // Start with enabled config
      const config1: MockEnclosureConfig = {
        enabled: true,
        controllerModel: EnclosureModel.M40,
        expansionModels: [],
        scenario: MockEnclosureScenario.FillSomeSlots,
      };

      store$.overrideSelector(selectEnclosureMockConfig, config1);
      store$.overrideSelector(selectMockConfigs, []);
      store$.refreshState();

      const initialCalls = (store$.dispatch as jest.Mock).mock.calls.length;
      expect(initialCalls).toBeGreaterThan(0);

      // Rapid change 1: Different controller
      jest.clearAllMocks();
      const config2: MockEnclosureConfig = {
        ...config1,
        controllerModel: EnclosureModel.M50,
      };

      store$.overrideSelector(selectEnclosureMockConfig, config2);
      store$.overrideSelector(selectMockConfigs, [
        {
          id: 'enclosure-mock-dashboard', enabled: true, methodName: 'webui.enclosure.dashboard', response: { type: 'success', result: [] },
        },
        {
          id: 'enclosure-mock-is-ix-hardware', enabled: true, methodName: 'truenas.is_ix_hardware', response: { type: 'success', result: true },
        },
      ]);
      store$.refreshState();

      expect(store$.dispatch).toHaveBeenCalled();

      // Rapid change 2: Add expansion shelves
      jest.clearAllMocks();
      const config3: MockEnclosureConfig = {
        ...config2,
        expansionModels: [EnclosureModel.Es24F, EnclosureModel.Es102],
      };

      store$.overrideSelector(selectEnclosureMockConfig, config3);
      store$.refreshState();

      expect(store$.dispatch).toHaveBeenCalled();

      // All changes happen without page reload
      // The service reacts to store changes immediately
    });

    it('should clean up mocks when disabled without reload', () => {
      // Start with enabled config
      const enabledConfig: MockEnclosureConfig = {
        enabled: true,
        controllerModel: EnclosureModel.M40,
        expansionModels: [],
        scenario: MockEnclosureScenario.FillSomeSlots,
      };

      store$.overrideSelector(selectEnclosureMockConfig, enabledConfig);
      store$.overrideSelector(selectMockConfigs, []);
      store$.refreshState();

      jest.clearAllMocks();

      // Disable mocking
      const disabledConfig: MockEnclosureConfig = {
        ...enabledConfig,
        enabled: false,
      };

      store$.overrideSelector(selectEnclosureMockConfig, disabledConfig);
      store$.refreshState();

      // Verify delete actions are dispatched immediately
      expect(store$.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: '[WebSocket Debug] Delete Mock Config',
          id: 'enclosure-mock-dashboard',
        }),
      );

      expect(store$.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: '[WebSocket Debug] Delete Mock Config',
          id: 'enclosure-mock-is-ix-hardware',
        }),
      );

      // No page reload required - mocks are removed immediately
    });
  });

  describe('MockResponseService Integration', () => {
    it('should work seamlessly with MockResponseService', () => {
      // The EnclosureMockService creates MockConfig objects
      // These are stored in the same store that MockResponseService reads from
      // This ensures real-time updates without page reload

      const mockConfigs: MockConfig[] = [];

      // When enclosure mocking is enabled
      const config: MockEnclosureConfig = {
        enabled: true,
        controllerModel: EnclosureModel.M40,
        expansionModels: [],
        scenario: MockEnclosureScenario.FillSomeSlots,
      };

      store$.overrideSelector(selectEnclosureMockConfig, config);
      store$.overrideSelector(selectMockConfigs, mockConfigs);
      store$.refreshState();

      // The service dispatches actions to add mock configs
      expect(store$.dispatch).toHaveBeenCalledWith(
        addMockConfig({
          config: expect.objectContaining({
            methodName: 'webui.enclosure.dashboard',
          }),
        }),
      );

      // MockResponseService will immediately see these new configs
      // and return mock responses for matching WebSocket calls
      // No page reload required
    });
  });
});
