import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { enclosureMocks } from 'app/core/testing/mock-enclosure/enclosure-templates/enclosure-mocks';
import { MockEnclosureScenario, mockEnclosureScenarioLabels } from 'app/core/testing/mock-enclosure/enums/mock-enclosure.enum';
import { MockEnclosureConfig } from 'app/core/testing/mock-enclosure/interfaces/mock-enclosure.interface';
import { EnclosureModel } from 'app/enums/enclosure-model.enum';
import { setEnclosureMockConfig } from 'app/modules/websocket-debug-panel/store/websocket-debug.actions';
import { selectEnclosureMockConfig } from 'app/modules/websocket-debug-panel/store/websocket-debug.selectors';
import { EnclosureMockService } from 'app/services/enclosure-mock.service';
import { EnclosureMockTabComponent } from './enclosure-mock-tab.component';

describe('EnclosureMockTabComponent - End to End', () => {
  let spectator: Spectator<EnclosureMockTabComponent>;
  let store$: MockStore;
  let mockService: EnclosureMockService;

  const initialMockConfig: MockEnclosureConfig = {
    enabled: false,
    controllerModel: null,
    expansionModels: [],
    scenario: MockEnclosureScenario.FillSomeSlots,
  };

  const createComponent = createComponentFactory({
    component: EnclosureMockTabComponent,
    imports: [ReactiveFormsModule],
    providers: [
      provideMockStore({
        selectors: [
          {
            selector: selectEnclosureMockConfig,
            value: initialMockConfig,
          },
        ],
      }),
      mockProvider(EnclosureMockService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    store$ = spectator.inject(MockStore);
    mockService = spectator.inject(EnclosureMockService);
    jest.spyOn(store$, 'dispatch');
  });

  describe('Complete Workflow', () => {
    it('should handle the complete enclosure mocking workflow', () => {
      // Step 1: Component initializes with store configuration
      spectator.component.ngOnInit();
      spectator.detectChanges();

      const form = spectator.component.form;
      // When disabled, only enabled field is in form.value
      expect(form.value.enabled).toBe(false);
      expect(form.controls.controllerModel.value).toBeNull();
      expect(form.controls.expansionModels.value).toEqual([]);
      expect(form.controls.scenario.value).toBe(MockEnclosureScenario.FillSomeSlots);

      // Step 2: User enables mocking and configures settings
      form.patchValue({
        enabled: true,
        controllerModel: EnclosureModel.M50,
        expansionModels: [EnclosureModel.Es24F, EnclosureModel.Es102],
        scenario: MockEnclosureScenario.FillAllSlots,
      });

      // Step 3: Form controls enable/disable properly
      expect(form.controls.controllerModel.disabled).toBe(false);
      expect(form.controls.expansionModels.disabled).toBe(false);
      expect(form.controls.scenario.disabled).toBe(false);

      // Step 4: User clicks apply
      spectator.component.onApply();

      // Step 5: Verify the action is dispatched with correct payload
      expect(store$.dispatch).toHaveBeenCalledWith(
        setEnclosureMockConfig({
          config: {
            enabled: true,
            controllerModel: EnclosureModel.M50,
            expansionModels: [EnclosureModel.Es24F, EnclosureModel.Es102],
            scenario: MockEnclosureScenario.FillAllSlots,
          },
        }),
      );

      // Step 6: Service is injected and would respond to store changes
      expect(mockService).toBeDefined();
    });

    it('should handle disabling enclosure mocking', () => {
      // Start with enabled configuration
      const enabledConfig: MockEnclosureConfig = {
        enabled: true,
        controllerModel: EnclosureModel.M40,
        expansionModels: [EnclosureModel.Es24F],
        scenario: MockEnclosureScenario.FillSomeSlots,
      };

      store$.overrideSelector(selectEnclosureMockConfig, enabledConfig);
      store$.refreshState();

      spectator.component.ngOnInit();
      spectator.detectChanges();

      const form = spectator.component.form;

      // Verify form loaded with enabled config
      expect(form.value.enabled).toBe(true);
      expect(form.value.controllerModel).toBe(EnclosureModel.M40);

      // User disables mocking
      form.patchValue({ enabled: false });

      // Form controls should be disabled
      expect(form.controls.controllerModel.disabled).toBe(true);
      expect(form.controls.expansionModels.disabled).toBe(true);
      expect(form.controls.scenario.disabled).toBe(true);

      // Apply changes
      spectator.component.onApply();

      // Verify action dispatched to disable
      // Now using getRawValue(), all form values are sent even when disabled
      expect(store$.dispatch).toHaveBeenCalledWith(
        setEnclosureMockConfig({
          config: {
            enabled: false,
            controllerModel: EnclosureModel.M40,
            expansionModels: [EnclosureModel.Es24F],
            scenario: MockEnclosureScenario.FillSomeSlots,
          },
        }),
      );
    });

    it('should validate form before applying changes', () => {
      // Mock console.warn to prevent test failure
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      spectator.component.ngOnInit();
      spectator.detectChanges();

      const form = spectator.component.form;

      // Enable without selecting controller (invalid state)
      form.patchValue({
        enabled: true,
        controllerModel: null,
      });

      // Try to apply
      spectator.component.onApply();

      // Should log a warning
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Enclosure mock configuration invalid:',
        'Controller model is required when enclosure mocking is enabled',
      );

      // Should not dispatch action
      expect(store$.dispatch).not.toHaveBeenCalled();

      // Fix validation by selecting controller
      form.patchValue({
        controllerModel: EnclosureModel.M40,
      });

      // Now it should work
      spectator.component.onApply();

      expect(store$.dispatch).toHaveBeenCalledWith(
        setEnclosureMockConfig({
          config: expect.objectContaining({
            enabled: true,
            controllerModel: EnclosureModel.M40,
          }),
        }),
      );

      // Restore console.warn
      consoleWarnSpy.mockRestore();
    });

    it('should have correct form structure and options', () => {
      spectator.detectChanges();
      spectator.component.ngOnInit();

      const form = spectator.component.form;

      // Check form structure
      expect(form.controls.enabled).toBeDefined();
      expect(form.controls.controllerModel).toBeDefined();
      expect(form.controls.expansionModels).toBeDefined();
      expect(form.controls.scenario).toBeDefined();

      // Verify that enclosureMocks data is available
      const controllers = enclosureMocks.filter((mock) => mock.controller);
      const expansions = enclosureMocks.filter((mock) => !mock.controller);

      expect(controllers.length).toBeGreaterThan(0);
      expect(expansions.length).toBeGreaterThan(0);
      expect(mockEnclosureScenarioLabels.size).toBeGreaterThan(0);
    });
  });

  describe('Store Integration', () => {
    it('should update form when store state changes', () => {
      spectator.component.ngOnInit();
      spectator.detectChanges();

      const form = spectator.component.form;

      // Initial state
      expect(form.value.enabled).toBe(false);

      // Update store state
      const newConfig: MockEnclosureConfig = {
        enabled: true,
        controllerModel: EnclosureModel.Es24F,
        expansionModels: [EnclosureModel.Es102],
        scenario: MockEnclosureScenario.FillAllSlots,
      };

      store$.overrideSelector(selectEnclosureMockConfig, newConfig);
      store$.refreshState();

      // Re-initialize to pick up store changes
      spectator.component.ngOnInit();

      // Form should update
      expect(form.value).toEqual(newConfig);
    });
  });
});
