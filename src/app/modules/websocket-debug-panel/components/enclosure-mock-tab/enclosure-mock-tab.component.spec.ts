import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { MockEnclosureScenario, mockEnclosureScenarioLabels } from 'app/core/testing/mock-enclosure/enums/mock-enclosure.enum';
import { EnclosureModel } from 'app/enums/enclosure-model.enum';
import { setEnclosureMockConfig } from 'app/modules/websocket-debug-panel/store/websocket-debug.actions';
import { selectEnclosureMockConfig } from 'app/modules/websocket-debug-panel/store/websocket-debug.selectors';
import { EnclosureMockTabComponent } from './enclosure-mock-tab.component';

describe('EnclosureMockTabComponent', () => {
  let spectator: Spectator<EnclosureMockTabComponent>;
  let store$: MockStore;

  const createComponent = createComponentFactory({
    component: EnclosureMockTabComponent,
    imports: [ReactiveFormsModule],
    providers: [
      provideMockStore({
        initialState: {
          webSocketDebug: {
            enclosureMock: {
              enabled: false,
              controllerModel: null,
              expansionModels: [],
              scenario: MockEnclosureScenario.FillSomeSlots,
            },
          },
        },
      }),
    ],
    schemas: [NO_ERRORS_SCHEMA],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    store$ = spectator.inject(MockStore);
    jest.spyOn(store$, 'dispatch');
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });

  it('should disable form controls when enabled is false', () => {
    spectator.component.ngOnInit();
    const form = spectator.component.form;
    form.patchValue({ enabled: false });

    expect(form.controls.controllerModel.disabled).toBe(true);
    expect(form.controls.expansionModels.disabled).toBe(true);
    expect(form.controls.scenario.disabled).toBe(true);
  });

  it('should enable form controls when enabled is true', () => {
    const form = spectator.component.form;
    form.patchValue({ enabled: true });

    expect(form.controls.controllerModel.disabled).toBe(false);
    expect(form.controls.expansionModels.disabled).toBe(false);
    expect(form.controls.scenario.disabled).toBe(false);
  });

  it('should have default scenario set to FillSomeSlots', () => {
    const form = spectator.component.form;
    expect(form.value.scenario).toBe(MockEnclosureScenario.FillSomeSlots);
  });

  it('should not apply config when form is invalid and enabled', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const form = spectator.component.form;
    form.patchValue({ enabled: true, controllerModel: null });

    const initialFormValue = form.value;
    spectator.component.onApply();

    // Form should not have changed since it's invalid
    expect(form.value).toEqual(initialFormValue);
    expect(store$.dispatch).not.toHaveBeenCalled();
    expect(spectator.component.validationError).toBe('Controller model is required when enclosure mocking is enabled');
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Enclosure mock configuration invalid:',
      'Controller model is required when enclosure mocking is enabled',
    );

    consoleWarnSpy.mockRestore();
  });

  it('should apply config when disabled (clearing the config)', () => {
    const form = spectator.component.form;
    form.patchValue({
      enabled: false,
      controllerModel: 'M50',
      expansionModels: ['ES102'],
      scenario: MockEnclosureScenario.FillAllSlots,
    });

    spectator.component.onApply();

    expect(store$.dispatch).toHaveBeenCalledWith(
      setEnclosureMockConfig({
        config: {
          enabled: false,
          controllerModel: EnclosureModel.M50,
          expansionModels: [EnclosureModel.Es102],
          scenario: MockEnclosureScenario.FillAllSlots,
        },
      }),
    );
  });

  it('should clear validation error when form becomes valid', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const form = spectator.component.form;

    // First, make it invalid
    form.patchValue({ enabled: true, controllerModel: null });
    spectator.component.onApply();
    expect(spectator.component.validationError).toBeTruthy();

    // Reset the spy count
    jest.clearAllMocks();

    // Then make it valid
    form.patchValue({ controllerModel: 'M50' });
    spectator.component.onApply();

    expect(spectator.component.validationError).toBeNull();
    expect(store$.dispatch).toHaveBeenCalledWith(
      setEnclosureMockConfig({
        config: {
          enabled: true,
          controllerModel: EnclosureModel.M50,
          expansionModels: [],
          scenario: MockEnclosureScenario.FillSomeSlots,
        },
      }),
    );

    consoleWarnSpy.mockRestore();
  });

  it('should apply config when form is valid', () => {
    const form = spectator.component.form;
    form.patchValue({
      enabled: true,
      controllerModel: 'M50',
      expansionModels: ['ES102'],
      scenario: MockEnclosureScenario.FillAllSlots,
    });

    spectator.component.onApply();

    expect(form.valid).toBe(true);
    expect(store$.dispatch).toHaveBeenCalledWith(
      setEnclosureMockConfig({
        config: {
          enabled: true,
          controllerModel: EnclosureModel.M50,
          expansionModels: [EnclosureModel.Es102],
          scenario: MockEnclosureScenario.FillAllSlots,
        },
      }),
    );
  });

  describe('ngOnInit', () => {
    it('should load current config from store', () => {
      const mockConfig = {
        enabled: true,
        controllerModel: EnclosureModel.M40,
        expansionModels: [EnclosureModel.Es24F],
        scenario: MockEnclosureScenario.FillAllSlots,
      };

      store$.overrideSelector(selectEnclosureMockConfig, mockConfig);

      spectator.component.ngOnInit();
      spectator.detectChanges();

      expect(spectator.component.form.value).toEqual({
        enabled: true,
        controllerModel: EnclosureModel.M40,
        expansionModels: [EnclosureModel.Es24F],
        scenario: MockEnclosureScenario.FillAllSlots,
      });
    });

    it('should setup form listeners on init', () => {
      // Set initial state with enabled = false
      const mockConfig = {
        enabled: false,
        controllerModel: null as EnclosureModel | null,
        expansionModels: [] as EnclosureModel[],
        scenario: MockEnclosureScenario.FillSomeSlots,
      };
      store$.overrideSelector(selectEnclosureMockConfig, mockConfig);

      spectator.component.ngOnInit();
      spectator.detectChanges();

      // Initially disabled when enabled is false
      expect(spectator.component.form.controls.controllerModel.disabled).toBe(true);
      expect(spectator.component.form.controls.expansionModels.disabled).toBe(true);
      expect(spectator.component.form.controls.scenario.disabled).toBe(true);

      // Enable when enabled is set to true
      spectator.component.form.controls.enabled.setValue(true);
      expect(spectator.component.form.controls.controllerModel.disabled).toBe(false);
      expect(spectator.component.form.controls.expansionModels.disabled).toBe(false);
      expect(spectator.component.form.controls.scenario.disabled).toBe(false);

      // Disable again when enabled is set to false
      spectator.component.form.controls.enabled.setValue(false);
      expect(spectator.component.form.controls.controllerModel.disabled).toBe(true);
      expect(spectator.component.form.controls.expansionModels.disabled).toBe(true);
      expect(spectator.component.form.controls.scenario.disabled).toBe(true);
    });
  });

  describe('getScenarioLabel', () => {
    it('should return correct label for known scenario', () => {
      // eslint-disable-next-line @typescript-eslint/dot-notation
      const label = spectator.component['getScenarioLabel'](MockEnclosureScenario.FillSomeSlots);
      const expectedLabel = mockEnclosureScenarioLabels.get(MockEnclosureScenario.FillSomeSlots);
      expect(label).toBe(expectedLabel);
    });

    it('should return empty string for unknown scenario', () => {
      // eslint-disable-next-line @typescript-eslint/dot-notation
      const label = spectator.component['getScenarioLabel']('UNKNOWN' as MockEnclosureScenario);
      expect(label).toBe('');
    });
  });

  describe('validation', () => {
    it('should validate scenario is required', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const form = spectator.component.form;
      form.patchValue({
        enabled: true,
        controllerModel: 'M50',
        scenario: null,
      });

      spectator.component.onApply();

      expect(spectator.component.validationError).toBe('Invalid scenario selected');
      expect(store$.dispatch).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Enclosure mock configuration invalid:',
        'Invalid scenario selected',
      );

      consoleWarnSpy.mockRestore();
    });

    it('should allow applying disabled config even with invalid form', () => {
      const form = spectator.component.form;
      form.patchValue({
        enabled: false,
        controllerModel: null, // Invalid, but should be allowed when disabled
        scenario: MockEnclosureScenario.FillSomeSlots,
      });

      spectator.component.onApply();

      expect(spectator.component.validationError).toBeNull();
      expect(store$.dispatch).toHaveBeenCalledWith(
        setEnclosureMockConfig({
          config: {
            enabled: false,
            controllerModel: null,
            expansionModels: [],
            scenario: MockEnclosureScenario.FillSomeSlots,
          },
        }),
      );
    });
  });
});
