import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { MockEnclosureScenario } from 'app/core/testing/mock-enclosure/enums/mock-enclosure.enum';
import { EnclosureModel } from 'app/enums/enclosure-model.enum';
import { setEnclosureMockConfig } from 'app/modules/websocket-debug-panel/store/websocket-debug.actions';
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
});
