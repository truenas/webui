import { MockEnclosureScenario } from 'app/core/testing/mock-enclosure/enums/mock-enclosure.enum';
import { EnclosureModel } from 'app/enums/enclosure-model.enum';
import { MockConfig } from 'app/modules/websocket-debug-panel/interfaces/mock-config.interface';
import { WebSocketDebugMessage } from 'app/modules/websocket-debug-panel/interfaces/websocket-debug.interface';
import { WebSocketDebugState } from './websocket-debug.reducer';
import * as fromSelectors from './websocket-debug.selectors';

describe('WebSocketDebug Selectors', () => {
  const mockMessages: WebSocketDebugMessage[] = [
    {
      id: '1',
      timestamp: '2024-01-01T10:00:00Z',
      direction: 'out',
      message: {
        jsonrpc: '2.0', id: '1', method: 'test.method' as never, params: [],
      },
    },
    {
      id: '2',
      timestamp: '2024-01-01T10:00:01Z',
      direction: 'in',
      message: { jsonrpc: '2.0', id: '1', result: { success: true } },
    },
    {
      id: '3',
      timestamp: '2024-01-01T10:00:02Z',
      direction: 'in',
      message: { jsonrpc: '2.0', id: '2', result: { data: 'mocked' } },
      isMocked: true,
    },
    {
      id: '4',
      timestamp: '2024-01-01T10:00:03Z',
      direction: 'out',
      message: { jsonrpc: '2.0', id: '3', method: 'another.method' as never },
    },
  ];

  const mockConfigs: MockConfig[] = [
    {
      id: 'config-1',
      enabled: true,
      methodName: 'test.method',
      response: { type: 'success', result: { success: true } },
    },
    {
      id: 'config-2',
      enabled: false,
      methodName: 'another.method',
      messagePattern: 'pattern',
      response: { type: 'success', result: null, delay: 1000 },
    },
    {
      id: 'config-3',
      enabled: true,
      methodName: 'third.method',
      response: { type: 'success', result: { data: 'test' } },
    },
  ];

  const initialState: WebSocketDebugState = {
    messages: mockMessages,
    mockConfigs,
    isPanelOpen: true,
    activeTab: 'websocket',
    messageLimit: 200,
    prefilledMockConfig: null,
    enclosureMock: {
      enabled: false,
      controllerModel: null,
      expansionModels: [],
      scenario: MockEnclosureScenario.FillSomeSlots,
    },
  };

  const rootState = {
    webSocketDebug: initialState,
  };

  describe('selectWebSocketDebugState', () => {
    it('should select the websocket debug feature state', () => {
      const result = fromSelectors.selectWebSocketDebugState(rootState);
      expect(result).toEqual(initialState);
    });
  });

  describe('selectMessages', () => {
    it('should select all messages', () => {
      const result = fromSelectors.selectMessages(rootState);
      expect(result).toEqual(mockMessages);
    });

    it('should return empty array when no messages', () => {
      const emptyState = {
        webSocketDebug: { ...initialState, messages: [] as WebSocketDebugMessage[] },
      };
      const result = fromSelectors.selectMessages(emptyState);
      expect(result).toEqual([]);
    });
  });

  describe('selectMockConfigs', () => {
    it('should select all mock configs', () => {
      const result = fromSelectors.selectMockConfigs(rootState);
      expect(result).toEqual(mockConfigs);
    });

    it('should return empty array when no configs', () => {
      const emptyState = {
        webSocketDebug: { ...initialState, mockConfigs: [] as MockConfig[] },
      };
      const result = fromSelectors.selectMockConfigs(emptyState);
      expect(result).toEqual([]);
    });
  });

  describe('selectIsPanelOpen', () => {
    it('should select panel open state', () => {
      const result = fromSelectors.selectIsPanelOpen(rootState);
      expect(result).toBe(true);
    });

    it('should return false when panel is closed', () => {
      const closedState = {
        webSocketDebug: { ...initialState, isPanelOpen: false },
      };
      const result = fromSelectors.selectIsPanelOpen(closedState);
      expect(result).toBe(false);
    });
  });

  describe('selectActiveTab', () => {
    it('should select active tab', () => {
      const result = fromSelectors.selectActiveTab(rootState);
      expect(result).toBe('websocket');
    });

    it('should return different tab when changed', () => {
      const mockTabState = {
        webSocketDebug: { ...initialState, activeTab: 'mock' },
      };
      const result = fromSelectors.selectActiveTab(mockTabState);
      expect(result).toBe('mock');
    });
  });

  describe('selectMessageLimit', () => {
    it('should select message limit', () => {
      const result = fromSelectors.selectMessageLimit(rootState);
      expect(result).toBe(200);
    });

    it('should return custom limit when set', () => {
      const customLimitState = {
        webSocketDebug: { ...initialState, messageLimit: 500 },
      };
      const result = fromSelectors.selectMessageLimit(customLimitState);
      expect(result).toBe(500);
    });
  });

  describe('selectEnabledMockConfigs', () => {
    it('should select only enabled mock configs', () => {
      const result = fromSelectors.selectEnabledMockConfigs(rootState);
      expect(result).toHaveLength(2);
      expect(result).toEqual([mockConfigs[0], mockConfigs[2]]);
    });

    it('should return empty array when no configs are enabled', () => {
      const allDisabledState = {
        webSocketDebug: {
          ...initialState,
          mockConfigs: mockConfigs.map((config) => ({ ...config, enabled: false })),
        },
      };
      const result = fromSelectors.selectEnabledMockConfigs(allDisabledState);
      expect(result).toEqual([]);
    });
  });

  describe('selectHasActiveMocks', () => {
    it('should return true when there are enabled mock configs', () => {
      const result = fromSelectors.selectHasActiveMocks(rootState);
      expect(result).toBe(true);
    });

    it('should return false when no mock configs are enabled', () => {
      const noActiveState = {
        webSocketDebug: {
          ...initialState,
          mockConfigs: mockConfigs.map((config) => ({ ...config, enabled: false })),
        },
      };
      const result = fromSelectors.selectHasActiveMocks(noActiveState);
      expect(result).toBe(false);
    });

    it('should return false when there are no mock configs', () => {
      const emptyState = {
        webSocketDebug: { ...initialState, mockConfigs: [] as MockConfig[] },
      };
      const result = fromSelectors.selectHasActiveMocks(emptyState);
      expect(result).toBe(false);
    });
  });

  describe('selectMessageCount', () => {
    it('should return the count of messages', () => {
      const result = fromSelectors.selectMessageCount(rootState);
      expect(result).toBe(4);
    });

    it('should return 0 when no messages', () => {
      const emptyState = {
        webSocketDebug: { ...initialState, messages: [] as WebSocketDebugMessage[] },
      };
      const result = fromSelectors.selectMessageCount(emptyState);
      expect(result).toBe(0);
    });
  });

  describe('selectIncomingMessages', () => {
    it('should select only incoming messages', () => {
      const result = fromSelectors.selectIncomingMessages(rootState);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('2');
      expect(result[1].id).toBe('3');
      expect(result.every((msg) => msg.direction === 'in')).toBe(true);
    });

    it('should return empty array when no incoming messages', () => {
      const outgoingOnlyState = {
        webSocketDebug: {
          ...initialState,
          messages: mockMessages.filter((msg) => msg.direction === 'out'),
        },
      };
      const result = fromSelectors.selectIncomingMessages(outgoingOnlyState);
      expect(result).toEqual([]);
    });
  });

  describe('selectOutgoingMessages', () => {
    it('should select only outgoing messages', () => {
      const result = fromSelectors.selectOutgoingMessages(rootState);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('4');
      expect(result.every((msg) => msg.direction === 'out')).toBe(true);
    });

    it('should return empty array when no outgoing messages', () => {
      const incomingOnlyState = {
        webSocketDebug: {
          ...initialState,
          messages: mockMessages.filter((msg) => msg.direction === 'in'),
        },
      };
      const result = fromSelectors.selectOutgoingMessages(incomingOnlyState);
      expect(result).toEqual([]);
    });
  });

  describe('selectMockedMessages', () => {
    it('should select only mocked messages', () => {
      const result = fromSelectors.selectMockedMessages(rootState);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('3');
      expect(result[0].isMocked).toBe(true);
    });

    it('should return empty array when no mocked messages', () => {
      const noMockedState = {
        webSocketDebug: {
          ...initialState,
          messages: mockMessages.filter((msg) => !msg.isMocked),
        },
      };
      const result = fromSelectors.selectMockedMessages(noMockedState);
      expect(result).toEqual([]);
    });
  });

  describe('selector memoization', () => {
    it('should memoize selector results', () => {
      // Call selector twice with same state
      const result1 = fromSelectors.selectEnabledMockConfigs(rootState);
      const result2 = fromSelectors.selectEnabledMockConfigs(rootState);

      // Results should be the same reference (memoized)
      expect(result1).toBe(result2);
    });

    it('should recompute when dependent state changes', () => {
      const result1 = fromSelectors.selectEnabledMockConfigs(rootState);

      const updatedState = {
        webSocketDebug: {
          ...initialState,
          mockConfigs: [
            ...mockConfigs,
            {
              id: 'config-4',
              enabled: true,
              methodName: 'new.method',
              response: { result: {} },
            },
          ],
        },
      };

      const result2 = fromSelectors.selectEnabledMockConfigs(updatedState);

      // Results should be different
      expect(result1).not.toBe(result2);
      expect(result2).toHaveLength(3);
    });
  });

  describe('enclosure mock selectors', () => {
    describe('selectEnclosureMockConfig', () => {
      it('should select enclosure mock config', () => {
        const result = fromSelectors.selectEnclosureMockConfig(rootState);
        expect(result).toEqual({
          enabled: false,
          controllerModel: null,
          expansionModels: [],
          scenario: MockEnclosureScenario.FillSomeSlots,
        });
      });

      it('should return updated config when changed', () => {
        const updatedState = {
          webSocketDebug: {
            ...initialState,
            enclosureMock: {
              enabled: true,
              controllerModel: EnclosureModel.M40,
              expansionModels: [EnclosureModel.Es24F],
              scenario: MockEnclosureScenario.FillAllSlots,
            },
          },
        };
        const result = fromSelectors.selectEnclosureMockConfig(updatedState);
        expect(result).toEqual({
          enabled: true,
          controllerModel: EnclosureModel.M40,
          expansionModels: [EnclosureModel.Es24F],
          scenario: MockEnclosureScenario.FillAllSlots,
        });
      });
    });

    describe('selectIsEnclosureMockEnabled', () => {
      it('should select enclosure mock enabled state', () => {
        const result = fromSelectors.selectIsEnclosureMockEnabled(rootState);
        expect(result).toBe(false);
      });

      it('should return true when enclosure mock is enabled', () => {
        const enabledState = {
          webSocketDebug: {
            ...initialState,
            enclosureMock: {
              ...initialState.enclosureMock,
              enabled: true,
            },
          },
        };
        const result = fromSelectors.selectIsEnclosureMockEnabled(enabledState);
        expect(result).toBe(true);
      });
    });

    describe('selectEnclosureControllerModel', () => {
      it('should select controller model', () => {
        const result = fromSelectors.selectEnclosureControllerModel(rootState);
        expect(result).toBeNull();
      });

      it('should return controller model when set', () => {
        const withControllerState = {
          webSocketDebug: {
            ...initialState,
            enclosureMock: {
              ...initialState.enclosureMock,
              controllerModel: EnclosureModel.M50,
            },
          },
        };
        const result = fromSelectors.selectEnclosureControllerModel(withControllerState);
        expect(result).toBe(EnclosureModel.M50);
      });
    });

    describe('selectEnclosureExpansionModels', () => {
      it('should select expansion models', () => {
        const result = fromSelectors.selectEnclosureExpansionModels(rootState);
        expect(result).toEqual([]);
      });

      it('should return expansion models when set', () => {
        const withExpansionsState = {
          webSocketDebug: {
            ...initialState,
            enclosureMock: {
              ...initialState.enclosureMock,
              expansionModels: [EnclosureModel.Es24F, EnclosureModel.Es60],
            },
          },
        };
        const result = fromSelectors.selectEnclosureExpansionModels(withExpansionsState);
        expect(result).toEqual([EnclosureModel.Es24F, EnclosureModel.Es60]);
      });
    });

    describe('selectEnclosureScenario', () => {
      it('should select enclosure scenario', () => {
        const result = fromSelectors.selectEnclosureScenario(rootState);
        expect(result).toBe(MockEnclosureScenario.FillSomeSlots);
      });

      it('should return updated scenario when changed', () => {
        const differentScenarioState = {
          webSocketDebug: {
            ...initialState,
            enclosureMock: {
              ...initialState.enclosureMock,
              scenario: MockEnclosureScenario.AllSlotsEmpty,
            },
          },
        };
        const result = fromSelectors.selectEnclosureScenario(differentScenarioState);
        expect(result).toBe(MockEnclosureScenario.AllSlotsEmpty);
      });
    });

    describe('enclosure mock selector memoization', () => {
      it('should memoize enclosure mock selectors', () => {
        const result1 = fromSelectors.selectEnclosureMockConfig(rootState);
        const result2 = fromSelectors.selectEnclosureMockConfig(rootState);
        expect(result1).toBe(result2);

        const enabled1 = fromSelectors.selectIsEnclosureMockEnabled(rootState);
        const enabled2 = fromSelectors.selectIsEnclosureMockEnabled(rootState);
        expect(enabled1).toBe(enabled2);
      });

      it('should recompute when enclosure mock state changes', () => {
        const result1 = fromSelectors.selectIsEnclosureMockEnabled(rootState);

        const updatedState = {
          webSocketDebug: {
            ...initialState,
            enclosureMock: {
              ...initialState.enclosureMock,
              enabled: true,
            },
          },
        };

        const result2 = fromSelectors.selectIsEnclosureMockEnabled(updatedState);
        expect(result1).not.toBe(result2);
        expect(result1).toBe(false);
        expect(result2).toBe(true);
      });
    });
  });
});
