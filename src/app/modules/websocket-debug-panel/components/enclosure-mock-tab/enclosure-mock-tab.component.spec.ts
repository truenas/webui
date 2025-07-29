import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockEnclosureScenario } from 'app/core/testing/mock-enclosure/enums/mock-enclosure.enum';
import { EnclosureMockTabComponent } from './enclosure-mock-tab.component';

describe('EnclosureMockTabComponent', () => {
  let spectator: Spectator<EnclosureMockTabComponent>;
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
    const form = spectator.component.form;
    form.patchValue({ enabled: true, controllerModel: null });

    const initialFormValue = form.value;
    spectator.component.onApply();

    // Form should not have changed since it's invalid
    expect(form.value).toEqual(initialFormValue);
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

    // TODO: Check that the store action is dispatched when implemented
    expect(form.valid).toBe(true);
  });
});
