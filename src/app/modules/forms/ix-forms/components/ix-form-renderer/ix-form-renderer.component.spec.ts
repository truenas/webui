import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { AsyncValidatorFn, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import {
  TnAutocompleteHarness, TnCheckboxHarness, TnChipInputHarness, TnFormFieldHarness, TnInputHarness,
  TnSelectHarness, TnSelectOption,
} from '@truenas/ui-components';
import { of, Subject, throwError } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Role } from 'app/enums/role.enum';
import { FormSubmitEvent, SubmitResult } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { FormDefinition } from 'app/modules/forms/ix-forms/components/ix-form-renderer/form-definition.interface';
import { IxFormRendererComponent } from 'app/modules/forms/ix-forms/components/ix-form-renderer/ix-form-renderer.component';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { greaterThanFg } from 'app/modules/forms/ix-forms/validators/validators';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { TranslatedString } from 'app/modules/translate/translate.helper';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

const asTranslated = (value: string): TranslatedString => value as TranslatedString;

interface SampleForm {
  name: string;
  notes: string;
  enabled: boolean;
  flavor: string;
  min: number;
  max: number;
}

describe('IxFormRendererComponent', () => {
  let spectator: Spectator<IxFormRendererComponent<SampleForm>>;
  let loader: HarnessLoader;

  const submitHandler = jest.fn(
    (event: FormSubmitEvent<SampleForm>): SubmitResult => ({
      request$: of(event.allValues),
      successMessage: asTranslated('Saved'),
    }),
  );

  const flavorOptions: TnSelectOption[] = [
    { label: 'Vanilla', value: 'vanilla' },
    { label: 'Chocolate', value: 'chocolate' },
  ];

  const definition: FormDefinition<SampleForm> = {
    addTitle: asTranslated('Add Sample'),
    editTitle: asTranslated('Edit Sample'),
    requiredRoles: [Role.FullAdmin],
    formValidators: [greaterThanFg('max', ['min'], asTranslated('Max must be greater than Min'))],
    sections: [{
      title: asTranslated('Main'),
      fields: [
        {
          name: 'name', type: 'input', label: asTranslated('Name'), required: true,
        },
        { name: 'notes', type: 'textarea', label: asTranslated('Notes') },
        {
          name: 'enabled', type: 'checkbox', label: asTranslated('Enabled'), value: true,
        },
        {
          name: 'flavor', type: 'select', label: asTranslated('Flavor'), options: of(flavorOptions),
        },
        {
          name: 'min', type: 'input', inputType: 'number', label: asTranslated('Min'), value: 1,
        },
        {
          name: 'max', type: 'input', inputType: 'number', label: asTranslated('Max'), value: 5, validators: [Validators.max(10)],
        },
      ],
    }],
    submit: submitHandler,
  };

  const slideInRef: SlideInRef<unknown, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn(() => undefined),
  };

  const createComponent = createComponentFactory({
    component: IxFormRendererComponent<SampleForm>,
    imports: [ReactiveFormsModule],
    providers: [
      ...ixFormTestingProviders(),
      mockProvider(ErrorHandlerService),
      { provide: SlideInRef, useValue: slideInRef },
      mockAuth(),
    ],
  });

  beforeEach(() => {
    submitHandler.mockClear();
  });

  describe('rendering', () => {
    beforeEach(() => {
      spectator = createComponent({ props: { definition } });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('renders the matching tn-* control for each field type', async () => {
      expect(await loader.getHarnessOrNull(TnInputHarness.with({ name: 'name' }))).toBeTruthy();
      expect(await loader.getHarnessOrNull(TnCheckboxHarness.with({ label: 'Enabled' }))).toBeTruthy();
      expect(await loader.getHarnessOrNull(TnSelectHarness)).toBeTruthy();

      const notes = await loader.getHarness(TnInputHarness.with({ name: 'notes' }));
      expect(await notes.isMultiline()).toBe(true);

      const nameField = await loader.getHarness(TnFormFieldHarness.with({ label: 'Name' }));
      expect(await nameField.getLabel()).toBe('Name');
    });

    it('uses default values per type when no value is provided', async () => {
      const name = await loader.getHarness(TnInputHarness.with({ name: 'name' }));
      const notes = await loader.getHarness(TnInputHarness.with({ name: 'notes' }));
      const min = await loader.getHarness(TnInputHarness.with({ name: 'min' }));
      const max = await loader.getHarness(TnInputHarness.with({ name: 'max' }));
      const enabled = await loader.getHarness(TnCheckboxHarness.with({ label: 'Enabled' }));

      expect(await name.getValue()).toBe('');
      expect(await notes.getValue()).toBe('');
      expect(await min.getNumericValue()).toBe(1);
      expect(await max.getNumericValue()).toBe(5);
      expect(await enabled.isChecked()).toBe(true);
    });

    it('shows the modal title for create mode', () => {
      expect(spectator.query('ix-modal-header')).toBeTruthy();
      expect(spectator.fixture.nativeElement).toHaveText('Add Sample');
    });

    it('shows the required indicator on a required field, inferred from the validator', async () => {
      const nameField = await loader.getHarness(TnFormFieldHarness.with({ label: 'Name' }));
      const flavorField = await loader.getHarness(TnFormFieldHarness.with({ label: 'Flavor' }));

      expect(await nameField.isRequired()).toBe(true);
      expect(await flavorField.isRequired()).toBe(false);
    });
  });

  describe('explicit DOM id', () => {
    it('sets the host id only on fields that declare one', () => {
      const withId: FormDefinition<SampleForm> = {
        addTitle: asTranslated('Add Sample'),
        fields: [
          {
            name: 'enabled', type: 'checkbox', label: asTranslated('Enabled'), id: 'enable-2fa-global',
          },
          { name: 'name', type: 'input', label: asTranslated('Name') },
        ],
        submit: submitHandler,
      };
      spectator = createComponent({ props: { definition: withId } });

      // Deep-link targets (e.g. document.getElementById scroll/highlight) rely on this id.
      expect(spectator.query('#enable-2fa-global')).toBeTruthy();
      // Fields without an explicit id are left without one (no collision with `name`).
      expect(spectator.query('tn-input')?.getAttribute('id')).toBeNull();
    });
  });

  describe('validation and submit', () => {
    beforeEach(() => {
      spectator = createComponent({ props: { definition } });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('keeps Save disabled while a required field is empty', async () => {
      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));

      expect(await saveButton.isDisabled()).toBe(true);
    });

    it('enforces form-level validators from the definition', async () => {
      await (await loader.getHarness(TnInputHarness.with({ name: 'name' }))).setValue('sample');
      await (await loader.getHarness(TnInputHarness.with({ name: 'min' }))).setValue('8');
      await (await loader.getHarness(TnInputHarness.with({ name: 'max' }))).setValue('4');

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      expect(await saveButton.isDisabled()).toBe(true);
    });

    it('calls the definition submit handler with the form values', async () => {
      await (await loader.getHarness(TnInputHarness.with({ name: 'name' }))).setValue('sample');
      await (await loader.getHarness(TnInputHarness.with({ name: 'notes' }))).setValue('hello');
      await (await loader.getHarness(TnInputHarness.with({ name: 'max' }))).setValue('9');
      await (await loader.getHarness(TnSelectHarness)).selectOption('Chocolate');

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(submitHandler).toHaveBeenCalledTimes(1);
      const event = submitHandler.mock.calls[0][0];
      expect(event.isEdit).toBe(false);
      expect(event.allValues).toMatchObject({
        name: 'sample',
        notes: 'hello',
        enabled: true,
        flavor: 'chocolate',
        min: 1,
        max: 9,
      });
    });
  });

  describe('host-facing side-panel surface', () => {
    it('reports canSubmit only once the form is valid', async () => {
      spectator = createComponent({ props: { definition } });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);

      expect(spectator.component.canSubmit()).toBe(false);

      await (await loader.getHarness(TnInputHarness.with({ name: 'name' }))).setValue('sample');

      expect(spectator.component.canSubmit()).toBe(true);
    });

    it('reports isBusy while a submit is in flight and clears it once the request settles', async () => {
      const request$ = new Subject<unknown>();
      const busyDefinition: FormDefinition<SampleForm> = {
        ...definition,
        submit: () => ({ request$, successMessage: asTranslated('Saved') }),
      };
      spectator = createComponent({ props: { definition: busyDefinition } });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      await (await loader.getHarness(TnInputHarness.with({ name: 'name' }))).setValue('sample');

      expect(spectator.component.isBusy()).toBe(false);

      spectator.component.submit();
      expect(spectator.component.isBusy()).toBe(true);

      request$.next({});
      request$.complete();
      expect(spectator.component.isBusy()).toBe(false);
    });
  });

  describe('edit mode', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: {
          definition,
          editData: {
            name: 'existing', notes: 'note', enabled: false, flavor: 'vanilla', min: 2, max: 7,
          },
        },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('patches the form from editData and shows the edit title', async () => {
      const name = await loader.getHarness(TnInputHarness.with({ name: 'name' }));
      const min = await loader.getHarness(TnInputHarness.with({ name: 'min' }));
      const enabled = await loader.getHarness(TnCheckboxHarness.with({ label: 'Enabled' }));

      expect(spectator.fixture.nativeElement).toHaveText('Edit Sample');
      expect(await name.getValue()).toBe('existing');
      expect(await min.getNumericValue()).toBe(2);
      expect(await enabled.isChecked()).toBe(false);
    });
  });

  describe('combobox field', () => {
    const comboDefinition = {
      title: asTranslated('Combo'),
      fields: [{
        name: 'name',
        type: 'combobox',
        label: asTranslated('Flavor'),
        options: of([
          { label: 'Vanilla', value: 'vanilla' },
          { label: 'Chocolate', value: 'chocolate' },
        ]),
      }],
      submit: submitHandler,
    } as unknown as FormDefinition<SampleForm>;

    beforeEach(() => {
      spectator = createComponent({ props: { definition: comboDefinition } });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('renders a tn-autocomplete and commits the picked option to the control', async () => {
      const autocomplete = await loader.getHarness(TnAutocompleteHarness);
      await autocomplete.selectOption('Chocolate');

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(submitHandler.mock.calls[0][0].allValues).toMatchObject({ name: 'chocolate' });
    });
  });

  describe('chips field (free text)', () => {
    const chipsDefinition = {
      title: asTranslated('Chips'),
      fields: [{
        name: 'name', type: 'chips', label: asTranslated('Commands'),
      }],
      submit: submitHandler,
    } as unknown as FormDefinition<SampleForm>;

    beforeEach(() => {
      spectator = createComponent({ props: { definition: chipsDefinition } });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('renders a tn-chip-input that commits typed values as a string array', async () => {
      const chips = await loader.getHarness(TnChipInputHarness);
      await chips.addChip('ls');
      await chips.addChip('cat');

      expect(await chips.getChips()).toEqual(['ls', 'cat']);

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(submitHandler.mock.calls[0][0].allValues).toMatchObject({ name: ['ls', 'cat'] });
    });
  });

  describe('chips field (value mode)', () => {
    const chipsDefinition = {
      title: asTranslated('Chips'),
      fields: [{
        name: 'flavor',
        type: 'chips',
        label: asTranslated('Flavor'),
        allowCustomValue: false,
        options: of([
          { label: 'Vanilla', value: 'vanilla' },
          { label: 'Chocolate', value: 'chocolate' },
        ]),
      }],
      submit: submitHandler,
    } as unknown as FormDefinition<SampleForm>;

    beforeEach(() => {
      spectator = createComponent({ props: { definition: chipsDefinition } });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('displays option labels but commits their underlying values', async () => {
      const chips = await loader.getHarness(TnChipInputHarness);
      await chips.addChip('Chocolate');

      expect(await chips.getChips()).toEqual(['Chocolate']);

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(submitHandler.mock.calls[0][0].allValues).toMatchObject({ flavor: ['chocolate'] });
    });
  });

  describe('asyncValidators', () => {
    const alwaysInvalid: AsyncValidatorFn = () => of({ taken: true });
    const asyncDefinition = {
      title: asTranslated('Async'),
      fields: [{
        name: 'name', type: 'input', label: asTranslated('Name'), asyncValidators: [alwaysInvalid],
      }],
      submit: submitHandler,
    } as unknown as FormDefinition<SampleForm>;

    it('keeps Save disabled while an async validator reports invalid', async () => {
      spectator = createComponent({ props: { definition: asyncDefinition } });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);

      await (await loader.getHarness(TnInputHarness.with({ name: 'name' }))).setValue('taken');

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      expect(await saveButton.isDisabled()).toBe(true);
    });
  });

  describe('required select', () => {
    const requiredSelectDefinition = {
      title: asTranslated('Required Select'),
      fields: [{
        name: 'flavor', type: 'select', label: asTranslated('Flavor'), required: true, options: of(flavorOptions),
      }],
      submit: submitHandler,
    } as unknown as FormDefinition<SampleForm>;

    it('shows the required indicator on a required select (no explicit [required] threaded)', async () => {
      spectator = createComponent({ props: { definition: requiredSelectDefinition } });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);

      const flavorField = await loader.getHarness(TnFormFieldHarness.with({ label: 'Flavor' }));
      expect(await flavorField.isRequired()).toBe(true);
    });
  });

  describe('loadData', () => {
    const loadDataDefinition = {
      addTitle: asTranslated('Add Config'),
      editTitle: asTranslated('Edit Config'),
      fields: [{ name: 'name', type: 'input', label: asTranslated('Name') }],
      loadData: () => of({ name: 'loaded-value' }),
      submit: submitHandler,
    } as unknown as FormDefinition<SampleForm>;

    it('patches the form from the async loader and treats it as an edit', async () => {
      spectator = createComponent({ props: { definition: loadDataDefinition } });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);

      const name = await loader.getHarness(TnInputHarness.with({ name: 'name' }));
      expect(await name.getValue()).toBe('loaded-value');
      expect(spectator.fixture.nativeElement).toHaveText('Edit Config');
    });

    it('warns in dev mode when both loadData and editData are provided', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const conflictingDefinition = {
        editTitle: asTranslated('Edit Config'),
        fields: [{ name: 'name', type: 'input', label: asTranslated('Name') }],
        loadData: () => of({ name: 'loaded' }),
        submit: submitHandler,
      } as unknown as FormDefinition<SampleForm>;

      spectator = createComponent({ props: { definition: conflictingDefinition, editData: { name: 'edit' } } });

      expect(warn).toHaveBeenCalledWith(expect.stringContaining('mutually'));
      warn.mockRestore();
    });

    it('surfaces the error in a modal when the loader fails', () => {
      const error = new Error('load failed');
      const failingDefinition = {
        editTitle: asTranslated('Edit Config'),
        fields: [{ name: 'name', type: 'input', label: asTranslated('Name') }],
        loadData: () => throwError(() => error),
        submit: submitHandler,
      } as unknown as FormDefinition<SampleForm>;

      spectator = createComponent({ props: { definition: failingDefinition } });
      const errorHandler = spectator.inject(ErrorHandlerService);

      expect(errorHandler.showErrorModal).toHaveBeenCalledWith(error);
    });
  });

  describe('enabledWhen', () => {
    const enabledWhenDefinition = {
      title: asTranslated('Conditional Enable'),
      fields: [
        {
          name: 'enabled', type: 'checkbox', label: asTranslated('Enabled'), value: true,
        },
        {
          name: 'flavor',
          type: 'select',
          label: asTranslated('Flavor'),
          options: of(flavorOptions),
          enabledWhen: (value: SampleForm) => value.enabled,
        },
      ],
      submit: submitHandler,
    } as unknown as FormDefinition<SampleForm>;

    beforeEach(() => {
      spectator = createComponent({ props: { definition: enabledWhenDefinition } });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('enables the dependent field when the predicate is true', async () => {
      const flavor = await loader.getHarness(TnSelectHarness.with({ testId: 'flavor' }));
      expect(await flavor.isDisabled()).toBe(false);
    });

    it('disables the dependent field when the predicate becomes false', async () => {
      await (await loader.getHarness(TnCheckboxHarness.with({ label: 'Enabled' }))).uncheck();

      const flavor = await loader.getHarness(TnSelectHarness.with({ testId: 'flavor' }));
      expect(await flavor.isDisabled()).toBe(true);
    });
  });

  describe('visibleWhen', () => {
    const visibleWhenDefinition = {
      title: asTranslated('Conditional Visibility'),
      fields: [
        {
          name: 'enabled', type: 'checkbox', label: asTranslated('Enabled'), value: true,
        },
        {
          name: 'notes',
          type: 'textarea',
          label: asTranslated('Notes'),
          visibleWhen: (value: SampleForm) => value.enabled,
        },
      ],
      submit: submitHandler,
    } as unknown as FormDefinition<SampleForm>;

    beforeEach(() => {
      spectator = createComponent({ props: { definition: visibleWhenDefinition } });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('renders the field while the predicate is true', async () => {
      expect(await loader.getHarnessOrNull(TnInputHarness.with({ name: 'notes' }))).toBeTruthy();
    });

    it('removes the field and drops it from validation when the predicate is false', async () => {
      await (await loader.getHarness(TnCheckboxHarness.with({ label: 'Enabled' }))).uncheck();

      expect(await loader.getHarnessOrNull(TnInputHarness.with({ name: 'notes' }))).toBeNull();
    });
  });

  describe('section visibleWhen', () => {
    const sectionDefinition = {
      title: asTranslated('Sections'),
      sections: [
        {
          fields: [{
            name: 'enabled', type: 'checkbox', label: asTranslated('Enabled'), value: true,
          }],
        },
        {
          title: asTranslated('Peer'),
          visibleWhen: (value: SampleForm) => value.enabled,
          fields: [{
            name: 'name', type: 'input', label: asTranslated('Name'), required: true,
          }],
        },
      ],
      submit: submitHandler,
    } as unknown as FormDefinition<SampleForm>;

    beforeEach(() => {
      spectator = createComponent({ props: { definition: sectionDefinition } });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('renders the section while its predicate is true', async () => {
      expect(await loader.getHarnessOrNull(TnInputHarness.with({ name: 'name' }))).toBeTruthy();
    });

    it('removes the section and frees Save when its predicate is false', async () => {
      // The hidden section owns a required field; disabling it must clear that
      // requirement so Save isn't blocked by an invisible control.
      await (await loader.getHarness(TnCheckboxHarness.with({ label: 'Enabled' }))).uncheck();

      expect(await loader.getHarnessOrNull(TnInputHarness.with({ name: 'name' }))).toBeNull();

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      expect(await saveButton.isDisabled()).toBe(false);
    });
  });

  describe('visibleWhen in edit mode', () => {
    const editVisibilityDefinition = {
      editTitle: asTranslated('Edit'),
      fields: [
        { name: 'enabled', type: 'checkbox', label: asTranslated('Enabled') },
        {
          name: 'name',
          type: 'input',
          label: asTranslated('Name'),
          visibleWhen: (value: SampleForm) => value.enabled,
        },
      ],
      submit: submitHandler,
    } as unknown as FormDefinition<SampleForm>;

    it('still patches a field that starts hidden but is revealed by editData', async () => {
      spectator = createComponent({
        props: { definition: editVisibilityDefinition, editData: { enabled: true, name: 'patched' } },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);

      const name = await loader.getHarness(TnInputHarness.with({ name: 'name' }));
      expect(await name.getValue()).toBe('patched');
    });

    it('disables a field hidden by editData so its patched value never leaks into the submit', async () => {
      // The control is patched while still enabled, then disabled once the patch's
      // valueChanges re-runs the conditional pass — guarding the parent-before-child
      // lifecycle coupling that keeps a hidden field out of allValues/changedValues.
      spectator = createComponent({
        props: { definition: editVisibilityDefinition, editData: { enabled: false, name: 'stale' } },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);

      expect(await loader.getHarnessOrNull(TnInputHarness.with({ name: 'name' }))).toBeNull();

      await (await loader.getHarness(MatButtonHarness.with({ text: 'Save' }))).click();

      // changedValues omits the disabled control, so the stale value can't reach a
      // "send only what changed" payload; allValues (getRawValue) still carries it.
      expect(submitHandler.mock.calls[0][0].changedValues).not.toHaveProperty('name');
      expect(submitHandler.mock.calls[0][0].allValues).toHaveProperty('name', 'stale');
    });
  });

  describe('readonly', () => {
    const readonlyDefinition = {
      title: asTranslated('Readonly'),
      fields: [{
        name: 'name', type: 'input', label: asTranslated('Name'), readonly: true,
      }],
      submit: submitHandler,
    } as unknown as FormDefinition<SampleForm>;

    it('renders the input as read-only without disabling it', async () => {
      spectator = createComponent({ props: { definition: readonlyDefinition } });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);

      const name = await loader.getHarness(TnInputHarness.with({ name: 'name' }));
      expect(await name.isReadonly()).toBe(true);
      expect(await name.isDisabled()).toBe(false);
    });
  });

  describe('ignored-prop dev warning', () => {
    it('warns when a field sets a prop the renderer does not render for its type', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const misconfiguredDefinition = {
        title: asTranslated('Misconfigured'),
        fields: [
          {
            name: 'enabled', type: 'checkbox', label: asTranslated('Enabled'), readonly: true,
          },
          {
            name: 'flavor', type: 'select', label: asTranslated('Flavor'), placeholder: asTranslated('Pick'), options: of(flavorOptions),
          },
        ],
        submit: submitHandler,
      } as unknown as FormDefinition<SampleForm>;

      spectator = createComponent({ props: { definition: misconfiguredDefinition } });

      expect(warn).toHaveBeenCalledWith(expect.stringContaining('readonly'));
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('placeholder'));
      warn.mockRestore();
    });
  });
});
