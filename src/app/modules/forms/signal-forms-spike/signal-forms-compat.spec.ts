/* eslint-disable max-classes-per-file, @angular-eslint/component-max-inline-declarations */
/* eslint-disable angular-file-naming/component-filename-suffix */
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  ChangeDetectionStrategy, Component, computed, createEnvironmentInjector, EnvironmentInjector, input,
  runInInjectionContext, signal,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  AbstractControl, ControlValueAccessor, FormControl, FormGroup, NG_VALUE_ACCESSOR, NgControl,
  ReactiveFormsModule, ValidationErrors,
} from '@angular/forms';
import {
  disabled, FieldTree, form, FormField, FormRoot, hidden, minLength, ReadonlyFieldTree, required, submit, validate,
  ValidationError,
} from '@angular/forms/signals';
import { extractValue, SignalFormControl } from '@angular/forms/signals/compat';
import { By } from '@angular/platform-browser';
import { createComponentFactory, SpectatorFactory } from '@ngneat/spectator/jest';
import {
  TnAutocompleteComponent, TnButtonToggleComponent, TnButtonToggleGroupComponent, TnCheckboxComponent,
  TnCheckboxGroupComponent, TnCheckboxHarness, TnChipInputComponent, TnDateInputComponent, TnDateRangeInputComponent,
  TnFileInputComponent, TnFilePickerComponent, TnFormFieldComponent, TnFormFieldHarness, TnInputComponent,
  TnInputHarness, TnRadioComponent, TnRadioGroupComponent, TnSelectComponent, TnSelectHarness,
  TnSelectionListComponent, TnSlideToggleComponent, TnSlideToggleHarness, TnSliderComponent, TnSliderThumbDirective,
  TnStepComponent, TnStepperComponent, TnStepperHarness, TnTimeInputComponent,
} from '@truenas/ui-components';
import { isEqual } from 'lodash-es';
import {
  provideTnFormFieldDismissibleErrors, provideTnFormFieldErrors,
} from 'app/core/providers/tn-form-field-errors.provider';
import { DefaultValidationError } from 'app/enums/default-validation-error.enum';
import { IxPermissionsComponent } from 'app/modules/forms/controls/ix-permissions/ix-permissions.component';
import { IxStarRatingComponent } from 'app/modules/forms/controls/ix-star-rating/ix-star-rating.component';

/** The cast is another finding: `fieldTree: FieldTree<string>` only type-checks under strictNullChecks. */
function serverError(message: string, field: unknown): ValidationError.WithOptionalFieldTree {
  return { kind: 'server', message, fieldTree: field as ReadonlyFieldTree<unknown> };
}

/**
 * NAS-145110. These pin what Angular 22.2 signal forms do with the UNMODIFIED tn-* library and the webui
 * test tooling. Most of them assert a GAP, so a flipped assertion after an Angular or library bump means
 * the gap has closed and `docs/devs/signal-forms-spike.md` needs another look.
 */
@Component({
  selector: 'ix-spike-basic-controls',
  template: `
    <tn-form-field label="Name">
      <tn-input [formField]="form.name"></tn-input>
    </tn-form-field>
    <tn-form-field label="Protocol">
      <tn-select [formField]="form.protocol" [options]="options"></tn-select>
    </tn-form-field>
    <tn-checkbox label="Enabled" [formField]="form.enabled"></tn-checkbox>
    <tn-slide-toggle label="Toggle" [formField]="form.toggle"></tn-slide-toggle>
  `,
  imports: [
    FormField, TnFormFieldComponent, TnInputComponent, TnSelectComponent, TnCheckboxComponent, TnSlideToggleComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class BasicControlsHostComponent {
  readonly options = [{ label: 'HTTP', value: 'http' }, { label: 'HTTPS', value: 'https' }];
  readonly locked = signal(false);
  readonly model = signal({
    name: '', protocol: 'http', enabled: false, toggle: false,
  });

  readonly form = form(this.model, (path) => {
    required(path.name);
    disabled(path.name, { when: () => this.locked() });
    disabled(path.protocol, { when: () => this.locked() });
    disabled(path.enabled, { when: () => this.locked() });
    disabled(path.toggle, { when: () => this.locked() });
  });
}

/** All 18 CVAs the library ships, each bound to its own field. */
@Component({
  selector: 'ix-spike-all-controls',
  template: `
    <tn-input [formField]="form.input"></tn-input>
    <tn-select [formField]="form.select"></tn-select>
    <tn-autocomplete [formField]="form.autocomplete"></tn-autocomplete>
    <tn-chip-input [formField]="form.chips"></tn-chip-input>
    <tn-checkbox [formField]="form.checkbox"></tn-checkbox>
    <tn-checkbox-group [formField]="form.checkboxGroup"></tn-checkbox-group>
    <tn-radio value="a" [formField]="form.radio"></tn-radio>
    <tn-radio-group [formField]="form.radioGroup"></tn-radio-group>
    <tn-slide-toggle [formField]="form.toggle"></tn-slide-toggle>
    <tn-selection-list [formField]="form.selection"></tn-selection-list>
    <tn-date-input [formField]="form.date"></tn-date-input>
    <tn-date-range-input [formField]="form.dateRange"></tn-date-range-input>
    <tn-time-input [formField]="form.time"></tn-time-input>
    <tn-slider><input tnSliderThumb [formField]="form.slider" /></tn-slider>
    <tn-button-toggle-group [formField]="form.toggleGroup"></tn-button-toggle-group>
    <tn-button-toggle value="a" [formField]="form.buttonToggle"></tn-button-toggle>
    <tn-file-input [formField]="form.file"></tn-file-input>
    <tn-file-picker [formField]="form.picker"></tn-file-picker>
  `,
  imports: [
    FormField, TnInputComponent, TnSelectComponent, TnAutocompleteComponent, TnChipInputComponent, TnCheckboxComponent,
    TnCheckboxGroupComponent, TnRadioComponent, TnRadioGroupComponent, TnSlideToggleComponent, TnSelectionListComponent,
    TnDateInputComponent, TnDateRangeInputComponent, TnTimeInputComponent, TnSliderComponent, TnSliderThumbDirective,
    TnButtonToggleGroupComponent, TnButtonToggleComponent, TnFileInputComponent, TnFilePickerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class AllControlsHostComponent {
  readonly locked = signal(false);
  readonly model = signal({
    input: 'a',
    select: 'a',
    autocomplete: 'a',
    chips: ['a'],
    checkbox: false,
    checkboxGroup: ['a'],
    radio: 'a',
    radioGroup: 'a',
    toggle: false,
    selection: ['a'],
    date: null as Date | null,
    dateRange: null as { start: Date | null; end: Date | null } | null,
    time: '10:00',
    slider: 5,
    toggleGroup: 'a',
    buttonToggle: false,
    file: null as File[] | null,
    picker: 'a',
  });

  readonly form = form(this.model, (path) => {
    disabled(path, { when: () => this.locked() });
  });
}

interface CvaInternals extends ControlValueAccessor {
  onChange?: (value: unknown) => void;
  onChangeCallback?: (value: unknown) => void;
}

@Component({
  selector: 'ix-spike-reactive-baseline',
  template: `
    <form [formGroup]="group">
      <tn-form-field label="Name">
        <tn-input formControlName="name"></tn-input>
      </tn-form-field>
    </form>
  `,
  imports: [ReactiveFormsModule, TnFormFieldComponent, TnInputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ReactiveBaselineHostComponent {
  readonly group = new FormGroup({ name: new FormControl('') });
}

@Component({
  selector: 'ix-spike-signal-control',
  template: `
    <form [formGroup]="group">
      <tn-form-field label="Name">
        <tn-input formControlName="name"></tn-input>
      </tn-form-field>
    </form>
  `,
  imports: [ReactiveFormsModule, TnFormFieldComponent, TnInputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SignalFormControlHostComponent {
  readonly control = new SignalFormControl('', (path) => required(path));
  readonly group = new FormGroup({ name: this.control });
}

@Component({
  selector: 'ix-spike-composites',
  template: `
    <ix-star-rating [formField]="form.stars"></ix-star-rating>
    <ix-permissions [formField]="form.permissions"></ix-permissions>
  `,
  imports: [FormField, IxStarRatingComponent, IxPermissionsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class CompositeControlsHostComponent {
  readonly model = signal({ stars: 1, permissions: '644' });
  readonly form = form(this.model);
}

@Component({
  selector: 'ix-spike-step',
  template: `
    <tn-form-field label="Name">
      <tn-input [formField]="step().name"></tn-input>
    </tn-form-field>
  `,
  imports: [FormField, TnFormFieldComponent, TnInputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class WizardStepComponent {
  readonly step = input.required<FieldTree<{ name: string }>>();
}

@Component({
  selector: 'ix-spike-wizard',
  template: `
    <tn-stepper [linear]="true">
      <tn-step label="First" [completed]="fields.first().valid()">
        <ix-spike-step [step]="fields.first"></ix-spike-step>
      </tn-step>
      <tn-step label="Second" [completed]="fields.second().valid()">
        <ix-spike-step [step]="fields.second"></ix-spike-step>
      </tn-step>
    </tn-stepper>
  `,
  imports: [TnStepperComponent, TnStepComponent, WizardStepComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class WizardHostComponent {
  readonly model = signal({ first: { name: '' }, second: { name: '' } });
  readonly fields = form(this.model, (path) => {
    required(path.first.name);
    required(path.second.name);
  });
}

@Component({
  selector: 'ix-spike-dialog',
  template: `
    <form [formRoot]="fields">
      <tn-form-field label="Name">
        <tn-input [formField]="fields.name"></tn-input>
      </tn-form-field>
      <button type="submit">Save</button>
    </form>
  `,
  imports: [FormField, FormRoot, TnFormFieldComponent, TnInputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class DialogHostComponent {
  readonly action = jest.fn(() => Promise.resolve(serverError('Refused', this.fields.name)));
  readonly fields: FieldTree<{ name: string }> = form(signal({ name: '' }), (path) => required(path.name), {
    submission: { action: () => this.action() },
  });
}

describe('signal forms against unmodified tn-* controls (NAS-145110)', () => {
  const providers = [provideTnFormFieldErrors(), provideTnFormFieldDismissibleErrors()];
  const factories = new Map<unknown, unknown>([
    [BasicControlsHostComponent, createComponentFactory({ component: BasicControlsHostComponent, providers })],
    [AllControlsHostComponent, createComponentFactory({ component: AllControlsHostComponent, providers })],
    [ReactiveBaselineHostComponent, createComponentFactory({ component: ReactiveBaselineHostComponent, providers })],
    [SignalFormControlHostComponent, createComponentFactory({ component: SignalFormControlHostComponent, providers })],
    [CompositeControlsHostComponent, createComponentFactory({ component: CompositeControlsHostComponent, providers })],
    [WizardHostComponent, createComponentFactory({ component: WizardHostComponent, providers })],
    [DialogHostComponent, createComponentFactory({ component: DialogHostComponent, providers })],
  ]);

  async function render<T>(component: new () => T): Promise<{ fixture: ComponentFixture<T>; loader: HarnessLoader }> {
    const { fixture } = (factories.get(component) as SpectatorFactory<T>)();
    await fixture.whenStable();
    return { fixture, loader: TestbedHarnessEnvironment.loader(fixture) };
  }

  describe('value and disabled round trip through ControlValueAccessor (works)', () => {
    it('tn-input: model → view, view → model, dirty and touched', async () => {
      const { fixture, loader } = await render(BasicControlsHostComponent);
      const nameInput = await loader.getHarness(TnInputHarness);

      fixture.componentInstance.model.update((value) => ({ ...value, name: 'from-model' }));
      expect(await nameInput.getValue()).toBe('from-model');
      expect(fixture.componentInstance.form.name().dirty()).toBe(false);

      await nameInput.setValue('from-view');
      expect(fixture.componentInstance.model().name).toBe('from-view');
      expect(fixture.componentInstance.form.name().dirty()).toBe(true);

      await nameInput.blur();
      expect(fixture.componentInstance.form.name().touched()).toBe(true);
    });

    it('tn-select, tn-checkbox and tn-slide-toggle: view → model and model → view', async () => {
      const { fixture, loader } = await render(BasicControlsHostComponent);
      const { model } = fixture.componentInstance;

      const select = await loader.getHarness(TnSelectHarness);
      await select.selectOption('HTTPS');
      expect(model().protocol).toBe('https');

      const checkbox = await loader.getHarness(TnCheckboxHarness);
      await checkbox.check();
      expect(model().enabled).toBe(true);

      const toggle = await loader.getHarness(TnSlideToggleHarness);
      await toggle.check();
      expect(model().toggle).toBe(true);

      model.set({
        name: '', protocol: 'http', enabled: false, toggle: false,
      });
      expect(await select.getDisplayText()).toBe('HTTP');
      expect(await checkbox.isChecked()).toBe(false);
      expect(await toggle.isChecked()).toBe(false);
    });

    it('propagates a schema-driven disabled state to every control', async () => {
      const { fixture, loader } = await render(BasicControlsHostComponent);
      fixture.componentInstance.locked.set(true);
      await fixture.whenStable();

      expect(await (await loader.getHarness(TnInputHarness)).isDisabled()).toBe(true);
      expect(await (await loader.getHarness(TnSelectHarness)).isDisabled()).toBe(true);
      expect(await (await loader.getHarness(TnCheckboxHarness)).isDisabled()).toBe(true);
      expect(await (await loader.getHarness(TnSlideToggleHarness)).isDisabled()).toBe(true);
    });

    it.each([
      ['tn-input', 'input', 'b'],
      ['tn-select', 'select', 'b'],
      ['tn-autocomplete', 'autocomplete', 'b'],
      ['tn-chip-input', 'chips', ['b']],
      ['tn-checkbox', 'checkbox', true],
      ['tn-checkbox-group', 'checkboxGroup', ['b']],
      ['tn-radio', 'radio', 'b'],
      ['tn-radio-group', 'radioGroup', 'b'],
      ['tn-slide-toggle', 'toggle', true],
      ['tn-selection-list', 'selection', ['b']],
      ['tn-date-input', 'date', new Date(2026, 0, 2)],
      ['tn-date-range-input', 'dateRange', { start: new Date(2026, 0, 2), end: new Date(2026, 0, 3) }],
      ['tn-time-input', 'time', '11:00'],
      ['input[tnSliderThumb]', 'slider', 7],
      ['tn-button-toggle-group', 'toggleGroup', 'b'],
      ['tn-button-toggle', 'buttonToggle', true],
      ['tn-file-input', 'file', [new File([''], 'b.txt')]],
      ['tn-file-picker', 'picker', 'b'],
    ] as const)('%s: accessor change, writeValue and setDisabledState', async (selector, key, next) => {
      const { fixture } = await render(AllControlsHostComponent);
      const host = fixture.componentInstance;
      const [accessor] = fixture.debugElement.query(By.css(selector)).injector.get(NG_VALUE_ACCESSOR) as CvaInternals[];
      const writeValue = jest.spyOn(accessor, 'writeValue');
      const setDisabledState = jest.spyOn(accessor, 'setDisabledState' as never);

      (accessor.onChangeCallback ?? accessor.onChange)?.(next);
      expect(host.model()[key]).toEqual(next);
      expect(host.form[key]().dirty()).toBe(true);
      // The view already holds what it just emitted, so it must not be written straight back.
      fixture.detectChanges();
      expect(writeValue).not.toHaveBeenCalled();

      const initial = TestBed.runInInjectionContext(() => new AllControlsHostComponent().model()[key]);
      host.model.update((value) => ({ ...value, [key]: initial }));
      fixture.detectChanges();
      expect(writeValue).toHaveBeenCalledWith(initial);

      host.locked.set(true);
      fixture.detectChanges();
      expect(setDisabledState).toHaveBeenCalledWith(true);
    });
  });

  describe('tn-form-field error state (GAP: needs a library change)', () => {
    it('reactive baseline: the required error appears once the field is touched', async () => {
      const { fixture, loader } = await render(ReactiveBaselineHostComponent);
      const { group } = fixture.componentInstance;
      group.controls.name.setValidators(() => ({ required: true }));
      group.controls.name.updateValueAndValidity();
      group.controls.name.markAsTouched();

      expect(await (await loader.getHarness(TnFormFieldHarness)).getErrorMessage()).toBeTruthy();
    });

    it('never shows an error: InteropNgControl has no `events`/`statusChanges` for it to re-sync from', async () => {
      const { fixture, loader } = await render(BasicControlsHostComponent);
      const nameField = fixture.componentInstance.form.name;
      const nameInput = await loader.getHarness(TnInputHarness);
      const field = await loader.getHarness(TnFormFieldHarness.with({ label: 'Name' }));

      await nameInput.focus();
      await nameInput.blur();

      expect(nameField().touched()).toBe(true);
      expect(nameField().invalid()).toBe(true);
      expect(await field.hasError()).toBe(false);
    });

    it('still reads `required` once, so the asterisk is right at first render only', async () => {
      const { loader } = await render(BasicControlsHostComponent);
      const field = await loader.getHarness(TnFormFieldHarness.with({ label: 'Name' }));
      expect(await field.isRequired()).toBe(true);
    });

    it('a server-side error set by submit() does not reach the field either', async () => {
      const { fixture, loader } = await render(BasicControlsHostComponent);
      const host = fixture.componentInstance;
      const nameInput = await loader.getHarness(TnInputHarness);
      await nameInput.setValue('taken');

      await submit(host.form, () => Promise.resolve(serverError('Name is taken', host.form.name)));
      await fixture.whenStable();

      expect(host.form.name().errors().map((error) => error.message)).toEqual(['Name is taken']);
      expect(await (await loader.getHarness(TnFormFieldHarness.with({ label: 'Name' }))).hasError()).toBe(false);
    });
  });

  describe('data-test selectors (GAP: e2e breaking without a library change)', () => {
    it('reactive baseline: tn-input derives `input-name` from formControlName', async () => {
      const { fixture } = await render(ReactiveBaselineHostComponent);
      expect(fixture.nativeElement.querySelector('input').getAttribute('data-test')).toBe('input-name');
    });

    it('[formField] leaves the same control with no data-test at all', async () => {
      const { fixture } = await render(BasicControlsHostComponent);
      expect(fixture.nativeElement.querySelector('input').getAttribute('data-test')).toBeNull();
    });

    it('overwrites the `name` input with the generated field name', async () => {
      const { loader } = await render(BasicControlsHostComponent);
      expect(await (await loader.getHarness(TnInputHarness)).getName()).toMatch(/\.form\d+\.name$/);
    });
  });

  describe('harnesses', () => {
    it('reach a [formField] control by type and label, in a zoneless spec', async () => {
      const { loader } = await render(BasicControlsHostComponent);
      const field = await loader.getHarness(TnFormFieldHarness.with({ label: 'Protocol' }));
      expect(await field.getLabel()).toBe('Protocol');
    });

    it('gap: the formControlName ancestor pattern 150 specs rely on finds nothing', async () => {
      const { fixture, loader } = await render(BasicControlsHostComponent);
      expect(await loader.getHarnessOrNull(TnInputHarness.with({ selector: '[formControlName="name"]' }))).toBeNull();
      expect(fixture.nativeElement.querySelector('[formControlName]')).toBeNull();
    });
  });

  describe('validation errors', () => {
    it('gap: minLength reports a kind and shape the webui error resolver does not translate', () => {
      TestBed.runInInjectionContext(() => {
        const group = form(signal({ name: 'x' }), (path) => minLength(path.name, 3));
        const [error] = group.name().errors();

        expect(error.kind).toBe('minLength');
        expect(error.kind).not.toBe(DefaultValidationError.MinLength);
        expect(error).toEqual(expect.objectContaining({ minLength: 3 }));
        expect(error).not.toHaveProperty('requiredLength');
      });
    });

    it('existing ValidatorFns can be reused through a throwaway FormControl, unless they read .parent', () => {
      const isReserved = (control: AbstractControl<string>): ValidationErrors | null => {
        return control.value === 'root' ? { reserved: { message: 'Reserved' } } : null;
      };
      TestBed.runInInjectionContext(() => {
        const group = form(signal({ name: 'root' }), (path) => {
          validate(path.name, ({ value }) => {
            const result = isReserved(new FormControl(value(), { nonNullable: true }));
            return result ? { kind: 'reserved', message: 'Reserved' } : null;
          });
        });
        expect(group.name().errors().map((error) => error.message)).toEqual(['Reserved']);
      });
    });

    it('gap: a submit() error only clears when its own field changes, so another field cannot answer it', async () => {
      const { fixture, loader } = await render(BasicControlsHostComponent);
      const host = fixture.componentInstance;
      await (await loader.getHarness(TnInputHarness)).setValue('abc');
      await submit(host.form, () => Promise.resolve(serverError('Unreachable', host.form.name)));

      await (await loader.getHarness(TnCheckboxHarness)).check();

      expect(host.form().invalid()).toBe(true);
    });

    it('gap: the interop control lacks the members tn-form-field and tn-form-errors call', async () => {
      const { fixture } = await render(BasicControlsHostComponent);
      const control = fixture.debugElement.query(By.directive(TnInputComponent)).injector.get(NgControl);

      expect(control.name).toBeUndefined();
      expect(control.control?.events).toBeUndefined();
      expect(control.control?.setErrors).toBeUndefined();
    });
  });

  describe('model semantics', () => {
    it('gap: disabled and hidden values stay in the model, unlike FormGroup.value', () => {
      TestBed.runInInjectionContext(() => {
        const model = signal({ shown: 'a', off: 'b', gone: 'c' });
        const group = form(model, (path) => {
          disabled(path.off);
          hidden(path.gone, { when: () => true });
        });

        expect(group().value()).toEqual({ shown: 'a', off: 'b', gone: 'c' });
        // `enabled: true` drops the disabled field but keeps the hidden one, so payloads must exclude it by hand.
        expect(extractValue(group, { enabled: true })).toEqual({ shown: 'a', gone: 'c' });
      });
    });

    it('gap: object rows get a symbol key that lodash isEqual and toEqual see, though JSON does not', () => {
      TestBed.runInInjectionContext(() => {
        const row = { host: 'a' };
        const group = form(signal({ rows: [row] }));
        group.rows[0]().value();

        expect(group().value().rows[0]).toBe(row);
        expect(Object.getOwnPropertySymbols(row)).toHaveLength(1);
        expect(isEqual(row, { host: 'a' })).toBe(false);
        expect(row).not.toEqual({ host: 'a' });
        expect(JSON.stringify(row)).toBe('{"host":"a"}');
      });
    });

    it('gap: frozen rows throw, which is what NgRx hands out in dev mode', () => {
      // Its own injector: the form's internal effect hits the same TypeError, and would surface in a later test.
      const injector = createEnvironmentInjector([], TestBed.inject(EnvironmentInjector));
      runInInjectionContext(injector, () => {
        const group = form(signal({ rows: [Object.freeze({ host: 'a' })] }));
        expect(() => group.rows[0]).toThrow(TypeError);
      });
      injector.destroy();
    });

    it('primitive rows are tracked by index, so per-row state stays behind when a row above is removed', () => {
      TestBed.runInInjectionContext(() => {
        const model = signal({ rows: ['a', 'b'] });
        const group = form(model);
        group.rows[1]().markAsTouched();

        model.set({ rows: ['b'] });

        expect(group.rows[0]().value()).toBe('b');
        expect(group.rows[0]().touched()).toBe(false);
      });
    });

    it('object rows keep their state when a row above is removed', () => {
      TestBed.runInInjectionContext(() => {
        const [first, second] = [{ host: 'a' }, { host: 'b' }];
        const model = signal({ rows: [first, second] });
        const group = form(model);
        group.rows[1]().markAsTouched();

        model.set({ rows: [second] });

        expect(group.rows[0]().value()).toBe(second);
        expect(group.rows[0]().touched()).toBe(true);
      });
    });
  });

  describe('library fix feasibility', () => {
    it('the interop getters read signals, so an effect in tn-form-field could replace its events subscription', async () => {
      const { fixture, loader } = await render(BasicControlsHostComponent);
      const control = fixture.debugElement.query(By.directive(TnInputComponent)).injector.get(NgControl);
      const invalid = computed(() => control.invalid);
      const errorKeys = computed(() => Object.keys(control.errors ?? {}));

      expect(invalid()).toBe(true);
      expect(errorKeys()).toEqual(['required']);

      await (await loader.getHarness(TnInputHarness)).setValue('abc');

      expect(invalid()).toBe(false);
      expect(errorKeys()).toEqual([]);
    });

    it('the name the data-test fallback needs is available as the last segment of the field name', () => {
      TestBed.runInInjectionContext(() => {
        const group = form(signal({ name: '', rows: [{ host: '' }] }));
        expect(group.name().name().split('.').pop()).toBe('name');
        expect(group.rows[0].host().name().split('.').pop()).toBe('host');
      });
    });
  });

  describe('webui composite controls, which wire themselves through controlDirective.valueAccessor', () => {
    it('ix-star-rating and ix-permissions round trip a value', async () => {
      const { fixture } = await render(CompositeControlsHostComponent);
      const host = fixture.componentInstance;
      const stars = fixture.debugElement.query(By.directive(IxStarRatingComponent))
        .componentInstance as ControlValueAccessor;
      const permissions = fixture.debugElement.query(By.directive(IxPermissionsComponent))
        .componentInstance as CvaInternals;
      const writeStars = jest.spyOn(stars, 'writeValue');
      const writePermissions = jest.spyOn(permissions, 'writeValue');

      host.model.set({ stars: 4, permissions: '700' });
      fixture.detectChanges();

      expect(writeStars).toHaveBeenCalledWith(4);
      expect(writePermissions).toHaveBeenCalledWith('700');

      permissions.onChange?.('755');
      expect(host.model().permissions).toBe('755');
    });
  });

  describe('ix-form-renderer shape', () => {
    interface FieldDefinition {
      name: string;
      required?: boolean;
      visibleWhen?: (value: Record<string, unknown>) => boolean;
    }

    it('a schema can be generated from a definition, with visibleWhen mapping onto hidden()', () => {
      const definition: FieldDefinition[] = [
        { name: 'mode', required: true },
        { name: 'port', required: true, visibleWhen: (value) => value.mode === 'custom' },
      ];

      TestBed.runInInjectionContext(() => {
        const model = signal<Record<string, unknown>>({ mode: 'auto', port: null });
        const group = form(model, (path) => {
          for (const field of definition) {
            const fieldPath = path[field.name];
            if (field.required) {
              required(fieldPath);
            }
            if (field.visibleWhen) {
              const { visibleWhen } = field;
              hidden(fieldPath, { when: ({ valueOf }) => !visibleWhen(valueOf(path)) });
            }
          }
        });

        expect(group['port']().hidden()).toBe(true);
        expect(group().valid()).toBe(true);

        model.set({ mode: 'custom', port: null });

        expect(group['port']().hidden()).toBe(false);
        expect(group().valid()).toBe(false);
      });
    });
  });

  describe('form types', () => {
    it('wizard: a child step takes a FieldTree input, with no ControlContainer and one model for all steps', async () => {
      const { fixture, loader } = await render(WizardHostComponent);
      const host = fixture.componentInstance;
      const stepper = await loader.getHarness(TnStepperHarness);

      expect(await stepper.getStepCount()).toBe(2);
      expect(await stepper.isStepCompleted(0)).toBe(false);

      await (await loader.getHarness(TnInputHarness)).setValue('abc');

      expect(host.model().first.name).toBe('abc');
      expect(await stepper.isStepCompleted(0)).toBe(true);
      expect(await stepper.isStepCompleted(1)).toBe(false);
      expect(host.fields().valid()).toBe(false);
    });

    it('dialog: [formRoot] and form-level submission work with no <ix-form>', async () => {
      const { fixture, loader } = await render(DialogHostComponent);
      const host = fixture.componentInstance;
      const button = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;

      button.click();
      await fixture.whenStable();
      expect(host.action).not.toHaveBeenCalled();
      expect(host.fields.name().touched()).toBe(true);

      await (await loader.getHarness(TnInputHarness)).setValue('abc');
      button.click();
      await fixture.whenStable();
      expect(host.action).toHaveBeenCalledTimes(1);
      expect(host.fields.name().errors().map((error) => error.message)).toEqual(['Refused']);
    });
  });

  describe('SignalFormControl inside a real FormGroup (bottom-up migration path)', () => {
    it('keeps formControlName, data-test and the tn-form-field error, with the rule written the signal way', async () => {
      const { fixture, loader } = await render(SignalFormControlHostComponent);
      const host = fixture.componentInstance;
      const nameInput = await loader.getHarness(TnInputHarness);

      await nameInput.setValue('abc');
      expect(host.group.getRawValue()).toEqual({ name: 'abc' });
      expect(fixture.nativeElement.querySelector('input').getAttribute('data-test')).toBe('input-name');
      expect(host.group.valid).toBe(true);

      host.control.setValue('');
      await nameInput.blur();
      expect(host.group.invalid).toBe(true);
      expect(await (await loader.getHarness(TnFormFieldHarness)).hasError()).toBe(true);
    });
  });
});
