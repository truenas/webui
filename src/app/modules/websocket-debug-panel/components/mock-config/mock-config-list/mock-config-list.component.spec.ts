/* eslint-disable @typescript-eslint/dot-notation */
import { signal } from '@angular/core';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { MockConfig } from 'app/modules/websocket-debug-panel/interfaces/mock-config.interface';
import * as WebSocketDebugActions from 'app/modules/websocket-debug-panel/store/websocket-debug.actions';
import { selectMockConfigs, selectPrefilledMockConfig } from 'app/modules/websocket-debug-panel/store/websocket-debug.selectors';
import { MockConfigListComponent } from './mock-config-list.component';

describe('MockConfigListComponent', () => {
  let spectator: Spectator<MockConfigListComponent>;
  let store$: MockStore;

  const mockConfigs: MockConfig[] = [
    {
      id: 'config-1',
      enabled: true,
      methodName: 'test.method1',
      messagePattern: 'pattern1',
      response: { type: 'success', result: { success: true }, delay: 100 },
    },
    {
      id: 'config-2',
      enabled: false,
      methodName: 'test.method2',
      response: { type: 'success', result: null },
      events: [
        {
          delay: 1000,
          fields: {
            state: 'RUNNING',
            description: 'Event 1',
            result: { data: 1 },
          },
        },
      ],
    },
  ];

  const createComponent = createComponentFactory({
    component: MockConfigListComponent,
    providers: [
      provideMockStore({
        selectors: [
          {
            selector: selectMockConfigs,
            value: mockConfigs,
          },
          {
            selector: selectPrefilledMockConfig,
            value: null,
          },
        ],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    store$ = spectator.inject(MockStore);
    jest.spyOn(store$, 'dispatch');

    // Mock the selectSignal method to return appropriate values based on selector
    jest.spyOn(store$, 'selectSignal').mockImplementation((selector) => {
      if (selector === selectMockConfigs) {
        return signal(mockConfigs);
      }
      if (selector === selectPrefilledMockConfig) {
        return signal(null);
      }
      return signal(null);
    });
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });

  describe('mock config display', () => {
    it('should display mock configs from store', () => {
      const configs = spectator.component['mockConfigs']();
      expect(configs).toEqual(mockConfigs);
    });

    it('should compute hasEnabledMocks correctly', () => {
      expect(spectator.component['hasEnabledMocks']()).toBe(true);

      // Update the store to have disabled configs
      const disabledConfigs = [
        { ...mockConfigs[0], enabled: false },
        { ...mockConfigs[1], enabled: false },
      ];

      store$.overrideSelector(selectMockConfigs, disabledConfigs);
      store$.refreshState();
      spectator.detectChanges();

      // The component's computed signal should update
      expect(spectator.component['hasEnabledMocks']()).toBe(false);
    });

    it('should generate correct config descriptions', () => {
      expect(spectator.component['getConfigDescription'](mockConfigs[0]))
        .toBe('{success} • 100ms delay • pattern: pattern1');

      expect(spectator.component['getConfigDescription'](mockConfigs[1]))
        .toBe('1 events • null');

      const configWithoutPattern: MockConfig = {
        id: 'config-3',
        enabled: true,
        methodName: 'test.method3',
        response: { type: 'success', result: {} },
      };
      expect(spectator.component['getConfigDescription'](configWithoutPattern))
        .toBe('{}');
    });
  });

  describe('config actions', () => {
    it('should dispatch toggleMockConfig action', () => {
      spectator.component['toggleConfig']('config-1');

      expect(store$.dispatch).toHaveBeenCalledWith(
        WebSocketDebugActions.toggleMockConfig({ id: 'config-1' }),
      );
    });

    it('should dispatch deleteMockConfig action', () => {
      spectator.component['deleteConfig']('config-2');

      expect(store$.dispatch).toHaveBeenCalledWith(
        WebSocketDebugActions.deleteMockConfig({ id: 'config-2' }),
      );
    });

    it('should dispatch exportMockConfigs action', () => {
      spectator.component['exportConfigs']();

      expect(store$.dispatch).toHaveBeenCalledWith(
        WebSocketDebugActions.exportMockConfigs(),
      );
    });
  });

  describe('form interactions', () => {
    it('should show form for new config', () => {
      expect(spectator.component['showForm']).toBe(false);
      expect(spectator.component['editingConfig']).toBeNull();

      spectator.component['addNewConfig']();

      expect(spectator.component['showForm']).toBe(true);
      expect(spectator.component['editingConfig']).toBeNull();
      expect(spectator.component['prefilledMockData']).toBeNull();
    });

    it('should show form for editing config', () => {
      spectator.component['editConfig'](mockConfigs[0]);

      expect(spectator.component['showForm']).toBe(true);
      expect(spectator.component['editingConfig']).toEqual(mockConfigs[0]);
    });

    it('should dispatch addMockConfig for new config', () => {
      spectator.component['editingConfig'] = null;

      const newConfig: MockConfig = {
        id: 'new-config',
        enabled: true,
        methodName: 'new.method',
        response: { type: 'success', result: {} },
      };

      spectator.component['onFormSubmit'](newConfig);

      expect(store$.dispatch).toHaveBeenCalledWith(
        WebSocketDebugActions.addMockConfig({ config: newConfig }),
      );
      expect(spectator.component['showForm']).toBe(false);
      expect(spectator.component['editingConfig']).toBeNull();
    });

    it('should not dispatch addMockConfig when editing existing config', () => {
      spectator.component['editingConfig'] = mockConfigs[0];
      store$.dispatch = jest.fn();

      spectator.component['onFormSubmit'](mockConfigs[0]);

      // Should only dispatch clearPrefilledMockConfig, not addMockConfig
      expect(store$.dispatch).toHaveBeenCalledTimes(1);
      expect(store$.dispatch).toHaveBeenCalledWith(
        WebSocketDebugActions.clearPrefilledMockConfig(),
      );
      expect(spectator.component['showForm']).toBe(false);
      expect(spectator.component['editingConfig']).toBeNull();
    });

    it('should cancel form', () => {
      spectator.component['showForm'] = true;
      spectator.component['editingConfig'] = mockConfigs[0];

      spectator.component['onFormCancel']();

      expect(spectator.component['showForm']).toBe(false);
      expect(spectator.component['editingConfig']).toBeNull();
      expect(spectator.component['prefilledMockData']).toBeNull();
    });
  });

  describe('import functionality', () => {
    it('should import configs from file', async () => {
      const importedConfigs: MockConfig[] = [
        {
          id: 'imported-1',
          enabled: true,
          methodName: 'imported.method1',
          response: { type: 'success', result: {} },
        },
        {
          id: 'imported-2',
          enabled: false,
          methodName: 'imported.method2',
          response: { type: 'success', result: {} },
        },
      ];

      const file = new Blob([JSON.stringify(importedConfigs)], { type: 'application/json' });
      const event = {
        target: {
          files: [file],
        },
      } as unknown as Event;

      // Mock FileReader
      const mockFileReader = {
        onload: null as ((event: ProgressEvent<FileReader>) => void) | null,
        readAsText: jest.fn().mockImplementation(function (this: FileReader) {
          setTimeout(() => {
            if (this.onload) {
              this.onload({
                target: { result: JSON.stringify(importedConfigs) },
              } as ProgressEvent<FileReader>);
            }
          }, 0);
        }),
      };

      global.FileReader = jest.fn(() => mockFileReader) as unknown as typeof FileReader;

      spectator.component['importConfigs'](event);

      await new Promise((resolve) => {
        setTimeout(resolve, 10);
      });

      expect(store$.dispatch).toHaveBeenCalledWith(
        WebSocketDebugActions.addMockConfig({ config: importedConfigs[0] }),
      );
      expect(store$.dispatch).toHaveBeenCalledWith(
        WebSocketDebugActions.addMockConfig({ config: importedConfigs[1] }),
      );
    });

    it('should handle no file selected', () => {
      const event = {
        target: {
          files: [],
        },
      } as unknown as Event;

      spectator.component['importConfigs'](event);

      expect(store$.dispatch).not.toHaveBeenCalled();
    });
  });
});
