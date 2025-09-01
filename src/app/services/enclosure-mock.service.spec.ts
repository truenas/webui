import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { MockEnclosureScenario } from 'app/core/testing/mock-enclosure/enums/mock-enclosure.enum';
import { MockEnclosureConfig } from 'app/core/testing/mock-enclosure/interfaces/mock-enclosure.interface';
import { MockEnclosureGenerator } from 'app/core/testing/mock-enclosure/mock-enclosure-generator.utils';
import { EnclosureModel } from 'app/enums/enclosure-model.enum';
import { MockConfig } from 'app/modules/websocket-debug-panel/interfaces/mock-config.interface';
import {
  addMockConfig,
  deleteMockConfig,
  updateMockConfig,
} from 'app/modules/websocket-debug-panel/store/websocket-debug.actions';
import { selectEnclosureMockConfig, selectMockConfigs } from 'app/modules/websocket-debug-panel/store/websocket-debug.selectors';
import { EnclosureMockService } from './enclosure-mock.service';

jest.mock('app/core/testing/mock-enclosure/mock-enclosure-generator.utils');

describe('EnclosureMockService', () => {
  let spectator: SpectatorService<EnclosureMockService>;
  let store$: MockStore;
  const mockGenerator = {
    webuiDashboardEnclosureResponse: jest.fn(),
    enhanceSystemInfoResponse: jest.fn(),
  };

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
              scenario: MockEnclosureScenario.AllSlotsEmpty,
            } as MockEnclosureConfig,
          },
          {
            selector: selectMockConfigs,
            value: [],
          },
        ],
      }),
    ],
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (MockEnclosureGenerator as jest.Mock).mockImplementation(() => mockGenerator);
    spectator = createService();
    store$ = spectator.inject(MockStore);
    jest.spyOn(store$, 'dispatch');
  });

  describe('when enclosure mocking is disabled', () => {
    it('should not create mock generator', () => {
      expect(MockEnclosureGenerator).not.toHaveBeenCalled();
    });

    it('should not dispatch any mock config actions', () => {
      expect(store$.dispatch).not.toHaveBeenCalled();
    });
  });

  describe('when enclosure mocking is enabled', () => {
    const enabledConfig: MockEnclosureConfig = {
      enabled: true,
      controllerModel: EnclosureModel.M40,
      expansionModels: [EnclosureModel.Es24F],
      scenario: MockEnclosureScenario.FillSomeSlots,
    };

    beforeEach(() => {
      const mockDashboardResponse = [{ id: 'test-enclosure' }];
      mockGenerator.webuiDashboardEnclosureResponse.mockReturnValue(mockDashboardResponse);

      store$.overrideSelector(selectEnclosureMockConfig, enabledConfig);
      store$.overrideSelector(selectMockConfigs, []);
      store$.refreshState();
    });

    it('should create mock generator with config', () => {
      expect(MockEnclosureGenerator).toHaveBeenCalledWith(enabledConfig);
    });

    it('should dispatch addMockConfig actions for enclosure endpoints', () => {
      expect(store$.dispatch).toHaveBeenCalledWith(
        addMockConfig({
          config: {
            id: 'enclosure-mock-dashboard',
            enabled: true,
            methodName: 'webui.enclosure.dashboard',
            response: {
              type: 'success',
              result: [{ id: 'test-enclosure' }],
            },
          },
        }),
      );

      expect(store$.dispatch).toHaveBeenCalledWith(
        addMockConfig({
          config: {
            id: 'enclosure-mock-is-ix-hardware',
            enabled: true,
            methodName: 'truenas.is_ix_hardware',
            response: {
              type: 'success',
              result: true,
            },
          },
        }),
      );
    });

    it('should dispatch updateMockConfig when configs already exist', () => {
      jest.clearAllMocks();

      const existingConfigs: MockConfig[] = [
        {
          id: 'enclosure-mock-dashboard', enabled: false, methodName: 'webui.enclosure.dashboard', response: { type: 'success' as const, result: [] as unknown[] },
        },
        {
          id: 'enclosure-mock-is-ix-hardware', enabled: false, methodName: 'truenas.is_ix_hardware', response: { type: 'success' as const, result: false },
        },
      ];

      store$.overrideSelector(selectMockConfigs, existingConfigs);
      store$.refreshState();

      // Trigger another config update
      const newConfig = { ...enabledConfig, scenario: MockEnclosureScenario.FillAllSlots };
      store$.overrideSelector(selectEnclosureMockConfig, newConfig);
      store$.refreshState();

      expect(store$.dispatch).toHaveBeenCalledWith(
        updateMockConfig({
          config: expect.objectContaining({
            id: 'enclosure-mock-dashboard',
            enabled: true,
          }),
        }),
      );
    });
  });

  describe('when config changes', () => {
    it('should recreate mock generator when config changes', () => {
      const newConfig: MockEnclosureConfig = {
        enabled: true,
        controllerModel: EnclosureModel.M50,
        expansionModels: [],
        scenario: MockEnclosureScenario.FillAllSlots,
      };

      store$.overrideSelector(selectEnclosureMockConfig, newConfig);
      store$.overrideSelector(selectMockConfigs, []);
      store$.refreshState();

      expect(MockEnclosureGenerator).toHaveBeenCalledWith(newConfig);
    });

    it('should dispatch deleteMockConfig actions when disabled', () => {
      const enabledConfig: MockEnclosureConfig = {
        enabled: true,
        controllerModel: EnclosureModel.M40,
        expansionModels: [],
        scenario: MockEnclosureScenario.AllSlotsEmpty,
      };

      store$.overrideSelector(selectEnclosureMockConfig, enabledConfig);
      store$.overrideSelector(selectMockConfigs, []);
      store$.refreshState();

      expect(MockEnclosureGenerator).toHaveBeenCalled();
      jest.clearAllMocks();

      const disabledConfig: MockEnclosureConfig = {
        ...enabledConfig,
        enabled: false,
      };

      store$.overrideSelector(selectEnclosureMockConfig, disabledConfig);
      store$.refreshState();

      expect(store$.dispatch).toHaveBeenCalledWith(
        deleteMockConfig({ id: 'enclosure-mock-dashboard' }),
      );
      expect(store$.dispatch).toHaveBeenCalledWith(
        deleteMockConfig({ id: 'enclosure-mock-is-ix-hardware' }),
      );
      expect(store$.dispatch).toHaveBeenCalledWith(
        deleteMockConfig({ id: 'enclosure-mock-system-info' }),
      );
      expect(store$.dispatch).toHaveBeenCalledWith(
        deleteMockConfig({ id: 'enclosure-mock-main-dashboard-sys-info' }),
      );
    });
  });

  describe('ngOnDestroy', () => {
    it('should dispatch deleteMockConfig for all enclosure mocks on destroy', () => {
      spectator.service.ngOnDestroy();

      expect(store$.dispatch).toHaveBeenCalledWith(
        deleteMockConfig({ id: 'enclosure-mock-dashboard' }),
      );
      expect(store$.dispatch).toHaveBeenCalledWith(
        deleteMockConfig({ id: 'enclosure-mock-is-ix-hardware' }),
      );
      expect(store$.dispatch).toHaveBeenCalledWith(
        deleteMockConfig({ id: 'enclosure-mock-system-info' }),
      );
      expect(store$.dispatch).toHaveBeenCalledWith(
        deleteMockConfig({ id: 'enclosure-mock-main-dashboard-sys-info' }),
      );
    });
  });
});
