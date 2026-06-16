import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { AsyncValidatorFn, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import {
  TnAutocompleteHarness, TnCheckboxHarness, TnFormFieldHarness, TnInputHarness, TnSelectHarness, TnSelectOption,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Role } from 'app/enums/role.enum';
import { FormSubmitEvent, SubmitResult } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { FormDefinition } from 'app/modules/forms/ix-forms/components/ix-form-renderer/form-definition.interface';
import { IxFormRendererComponent } from 'app/modules/forms/ix-forms/components/ix-form-renderer/ix-form-renderer.component';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { greaterThanFg } from 'app/modules/forms/ix-forms/validators/validators';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { TranslatedString } from 'app/modules/translate/translate.helper';

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
  });
});
