/* eslint-disable @angular-eslint/component-max-inline-declarations, max-classes-per-file */
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { fakeAsync, tick } from '@angular/core/testing';
import {
  FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest'; // cspell:ignore ngneat
import {
  concat, EMPTY, firstValueFrom, NEVER, Observable, of, throwError,
} from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Role } from 'app/enums/role.enum';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TranslatedString } from 'app/modules/translate/translate.helper';
import { FormSubmitEvent, IxFormComponent, SubmitResult } from './ix-form.component';

describe('IxFormComponent', () => {
  // Hosts call this via a closure (not `handleSubmit = submitHandlerSpy`) so the
  // per-test reassignment in beforeEach is seen — don't inline the lambda.
  let submitHandlerSpy: jest.Mock<SubmitResult, [FormSubmitEvent]>;

  @Component({
    template: `
      <ix-form
        [formGroup]="form"
        [editData]="editData"
        [title]="'Test Form'"
        [requiredRoles]="[role]"
        [submitHandler]="handleSubmit"
      >
        <ix-fieldset>
          <ix-input formControlName="name" [label]="'Name'" />
          <ix-input formControlName="description" [label]="'Description'" />
        </ix-fieldset>
      </ix-form>
    `,
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'ix-test-host',
    imports: [ReactiveFormsModule, IxFormComponent, IxInputComponent, IxFieldsetComponent],
  })
  class TestHostComponent {
    ixForm = viewChild.required(IxFormComponent);
    role = Role.FullAdmin;
    editData: Record<string, unknown> | null = null;

    private fb = inject(FormBuilder);

    form = this.fb.group({
      name: [''],
      description: [''],
    });

    handleSubmit = (event: FormSubmitEvent): SubmitResult => submitHandlerSpy(event);
  }

  @Component({
    template: `
      <ix-form
        [formGroup]="form"
        [editData]="editData"
        [addTitle]="'Add Group'"
        [editTitle]="'Edit Group'"
        [requiredRoles]="[role]"
        [submitHandler]="handleSubmit"
      >
        <ix-fieldset>
          <ix-input formControlName="name" [label]="'Name'" />
        </ix-fieldset>
        <button ixExtraActions mat-button type="button">Advanced Options</button>
      </ix-form>
    `,
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'ix-auto-title-host',
    imports: [ReactiveFormsModule, IxFormComponent, IxInputComponent, IxFieldsetComponent, MatButton],
  })
  class AutoTitleHostComponent {
    ixForm = viewChild.required(IxFormComponent);
    role = Role.FullAdmin;
    editData: Record<string, unknown> | null = null;

    private fb = inject(FormBuilder);

    form = this.fb.group({
      name: [''],
    });

    handleSubmit = (event: FormSubmitEvent): SubmitResult => submitHandlerSpy(event);
  }

  let spectator: Spectator<TestHostComponent>;
  let loader: HarnessLoader;

  // Shared across describe blocks; reset per test (see beforeEach) so call
  // counts don't leak between tests.
  const slideInRef: SlideInRef<undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn((): undefined => undefined),
  };

  const createComponent = createComponentFactory({
    component: TestHostComponent,
    imports: [ReactiveFormsModule],
    providers: [
      ...ixFormTestingProviders(),
      mockProvider(SlideInRef, slideInRef),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    jest.clearAllMocks();
    submitHandlerSpy = jest.fn<SubmitResult, [FormSubmitEvent]>(() => ({
      request$: of(undefined),
      successMessage: 'Saved!' as TranslatedString,
    }));
  });

  describe('create mode', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('renders the save button', async () => {
      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      expect(saveButton).toBeTruthy();
    });

    it('calls submitHandler with all values when no editData is provided', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({ Name: 'New', Description: 'Desc' });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(submitHandlerSpy).toHaveBeenCalledWith({
        isEdit: false,
        allValues: { name: 'New', description: 'Desc' },
        changedValues: { name: 'New', description: 'Desc' },
      });
    });

    it('shows snackbar and closes slide-in on success', async () => {
      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('Saved!');
      expect(slideInRef.close).toHaveBeenCalledWith({ response: true });
    });

    it('passes the API result to onSuccess callback', async () => {
      const onSuccessSpy = jest.fn();
      const apiResult = { id: 42, name: 'Created' };
      submitHandlerSpy.mockReturnValue({
        request$: of(apiResult),
        successMessage: 'Saved!' as TranslatedString,
        onSuccess: onSuccessSpy,
      });

      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(onSuccessSpy).toHaveBeenCalledWith(apiResult);
    });

    it('re-enables the save button when observable completes without emitting', async () => {
      submitHandlerSpy.mockReturnValue({
        request$: EMPTY,
        successMessage: 'Saved!' as TranslatedString,
      });

      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();
      spectator.detectChanges();

      expect(await saveButton.isDisabled()).toBe(false);
      expect(spectator.inject(SnackbarService).success).not.toHaveBeenCalled();
      expect(slideInRef.close).not.toHaveBeenCalled();
    });

    it('uses closeWith to transform the slide-in close payload', async () => {
      const apiResult = { id: 42 };
      const closeWithSpy = jest.fn(() => ({ navigateTo: '/items/42' }));
      submitHandlerSpy.mockReturnValue({
        request$: of(apiResult),
        successMessage: 'Saved!' as TranslatedString,
        closeWith: closeWithSpy,
      });

      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(closeWithSpy).toHaveBeenCalledWith(apiResult);
      expect(slideInRef.close).toHaveBeenCalledWith({ response: { navigateTo: '/items/42' } });
    });
  });

  describe('edit mode', () => {
    const editData = { name: 'Original', description: 'Old desc' };

    beforeEach(() => {
      spectator = createComponent({ detectChanges: false });
      spectator.component.editData = editData;
      spectator.detectChanges();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('patches form with editData on init', () => {
      expect(spectator.component.form.value).toEqual(editData);
    });

    it('provides only changed properties in changedValues', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({ Description: 'New desc' });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(submitHandlerSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          isEdit: true,
          changedValues: { description: 'New desc' },
        }),
      );
    });

    it('provides empty changedValues when nothing changed', async () => {
      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(submitHandlerSpy).toHaveBeenCalledWith(
        expect.objectContaining({ changedValues: {} }),
      );
    });

    it('does not flag disabled controls as changed when their value is unchanged', async () => {
      // Snapshot is captured via getRawValue(), so disabling a control after
      // the snapshot was captured should not produce an entry in changedValues.
      spectator.component.form.controls.description.disable();

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(submitHandlerSpy).toHaveBeenCalledWith(
        expect.objectContaining({ changedValues: {} }),
      );
    });

    it('silently omits a control removed after the snapshot from changedValues', async () => {
      // Removed key is gone from getRawValue(), so the diff can't report it
      // even though it was in the snapshot (getChangedValues iterates current keys).
      (spectator.component.form as unknown as FormGroup).removeControl('description');

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      const event = submitHandlerSpy.mock.calls[0][0];
      expect(event.changedValues).not.toHaveProperty('description');
      expect(event.changedValues).toEqual({});
    });

    it('always flags a control added after the snapshot as changed', async () => {
      // Absent from the snapshot, so it appears in the diff despite being untouched.
      (spectator.component.form as unknown as FormGroup).addControl('extra', new FormControl('untouched'));

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(submitHandlerSpy.mock.calls[0][0].changedValues).toEqual({ extra: 'untouched' });
    });

    it('excludes disabled controls from changedValues', async () => {
      spectator.component.form.controls.name.setValue('changed');
      spectator.component.form.controls.name.disable();

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(submitHandlerSpy.mock.calls[0][0].changedValues).not.toHaveProperty('name');
    });

    it('dev-warns once when a top-level control is a nested FormGroup', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      (spectator.component.form as unknown as FormGroup).addControl(
        'attributes',
        new FormGroup({ host: new FormControl('') }),
      );

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();
      await saveButton.click();

      // Spy catches other dev warnings too; count only the nested-group one,
      // which must fire exactly once across both submits.
      const nestedWarnings = warnSpy.mock.calls.filter(
        ([message]) => typeof message === 'string' && message.includes('nested FormGroup/FormArray'),
      );
      expect(nestedWarnings).toHaveLength(1);
      expect(nestedWarnings[0][0]).toContain('"attributes"');
      warnSpy.mockRestore();
    });
  });

  describe('dirty confirmation', () => {
    // Pull the factory passed to slideInRef.requireConfirmationWhen so tests
    // can subscribe to it directly and assert what it emits.
    const getConfirmationFactory = (): () => Observable<boolean> => {
      const mock = slideInRef.requireConfirmationWhen as jest.Mock;
      const lastCall = mock.mock.calls.at(-1);
      if (!lastCall) {
        throw new Error('requireConfirmationWhen was not called');
      }
      return lastCall[0] as () => Observable<boolean>;
    };

    it('registers dirty confirmation with SlideInRef', () => {
      createComponent();
      expect(slideInRef.requireConfirmationWhen).toHaveBeenCalled();
    });

    it('default predicate emits false when the form is pristine', async () => {
      createComponent();
      await expect(firstValueFrom(getConfirmationFactory()())).resolves.toBe(false);
    });

    it('default predicate emits true once the form is dirty', async () => {
      spectator = createComponent();
      spectator.component.form.markAsDirty();
      await expect(firstValueFrom(getConfirmationFactory()())).resolves.toBe(true);
    });

    describe('dirtyPredicate override', () => {
      @Component({
        template: `
          <ix-form
            [formGroup]="form"
            [title]="'Predicate'"
            [requiredRoles]="[role]"
            [dirtyPredicate]="predicate"
            [submitHandler]="handleSubmit"
          >
            <ix-fieldset>
              <ix-input formControlName="name" [label]="'Name'" />
            </ix-fieldset>
          </ix-form>
        `,
        standalone: true,
        changeDetection: ChangeDetectionStrategy.OnPush,
        selector: 'ix-predicate-host',
        imports: [ReactiveFormsModule, IxFormComponent, IxInputComponent, IxFieldsetComponent],
      })
      class PredicateHostComponent {
        ixForm = viewChild.required(IxFormComponent);
        role = Role.FullAdmin;
        hasChanges = signal(false);
        predicate = (): Observable<boolean> => of(this.hasChanges());

        private fb = inject(FormBuilder);

        form = this.fb.group({ name: [''] });

        handleSubmit = (): SubmitResult => ({
          request$: of(undefined),
          successMessage: 'Saved!' as TranslatedString,
        });
      }

      const createPredicateComponent = createComponentFactory({
        component: PredicateHostComponent,
        imports: [ReactiveFormsModule],
        providers: [
          ...ixFormTestingProviders(),
          mockProvider(SlideInRef, slideInRef),
          mockAuth(),
        ],
      });

      it('uses the override and ignores formGroup.dirty', async () => {
        const predicateSpectator = createPredicateComponent();
        // Form is dirty, but predicate returns false — override must win.
        predicateSpectator.component.form.markAsDirty();
        await expect(firstValueFrom(getConfirmationFactory()())).resolves.toBe(false);

        // Flipping the external signal flips the result without touching form.
        predicateSpectator.component.hasChanges.set(true);
        await expect(firstValueFrom(getConfirmationFactory()())).resolves.toBe(true);
      });
    });
  });

  describe('submit guard', () => {
    // The save button is disabled while loading/invalid, so we can't click it —
    // pressing Enter in an input still fires the form's `submit` event, so
    // exercise that path directly via the <form> element.
    it('does not call submitHandler when submit fires while loading', async () => {
      // Start an in-flight submit (NEVER never emits/completes) — the wrapper
      // sets its internal loading state, which should block subsequent submits.
      submitHandlerSpy.mockReturnValueOnce({
        request$: NEVER,
        successMessage: 'Saved!' as TranslatedString,
      });
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();
      expect(submitHandlerSpy).toHaveBeenCalledTimes(1);

      // Second submit via Enter (button is disabled while loading, so we can't
      // click it) must be ignored — handler call count stays at 1.
      spectator.dispatchFakeEvent(spectator.query('form')!, 'submit');
      expect(submitHandlerSpy).toHaveBeenCalledTimes(1);
    });

    it('does not call submitHandler when submit fires with an invalid form', () => {
      spectator = createComponent();
      spectator.component.form.controls.name.setErrors({ required: true });

      spectator.dispatchFakeEvent(spectator.query('form')!, 'submit');

      expect(submitHandlerSpy).not.toHaveBeenCalled();
    });
  });

  describe('requireDirty', () => {
    @Component({
      template: `
        <ix-form
          [formGroup]="form"
          [title]="'Dirty Required'"
          [requireDirty]="true"
          [requiredRoles]="[role]"
          [submitHandler]="handleSubmit"
        >
          <ix-fieldset>
            <ix-input formControlName="name" [label]="'Name'" />
          </ix-fieldset>
        </ix-form>
      `,
      standalone: true,
      changeDetection: ChangeDetectionStrategy.OnPush,
      selector: 'ix-require-dirty-host',
      imports: [ReactiveFormsModule, IxFormComponent, IxInputComponent, IxFieldsetComponent],
    })
    class RequireDirtyHostComponent {
      ixForm = viewChild.required(IxFormComponent);
      role = Role.FullAdmin;

      private fb = inject(FormBuilder);

      form = this.fb.group({ name: [''] });

      handleSubmit = (event: FormSubmitEvent): SubmitResult => submitHandlerSpy(event);
    }

    const createRequireDirtyComponent = createComponentFactory({
      component: RequireDirtyHostComponent,
      imports: [ReactiveFormsModule],
      providers: [
        ...ixFormTestingProviders(),
        mockProvider(SlideInRef, slideInRef),
        mockAuth(),
      ],
    });

    it('disables Save while pristine and enables it once dirty', async () => {
      const requireDirtySpectator = createRequireDirtyComponent();
      const requireDirtyLoader = TestbedHarnessEnvironment.loader(requireDirtySpectator.fixture);
      const saveButton = await requireDirtyLoader.getHarness(MatButtonHarness.with({ text: 'Save' }));

      expect(await saveButton.isDisabled()).toBe(true);

      const form = await requireDirtyLoader.getHarness(IxFormHarness);
      await form.fillForm({ Name: 'Edited' });

      expect(await saveButton.isDisabled()).toBe(false);
    });

    it('ignores Enter-key submit while pristine', () => {
      const requireDirtySpectator = createRequireDirtyComponent();

      // ngSubmit fires on Enter even when the disabled button blocks click —
      // the component-side guard must mirror the disabled state.
      requireDirtySpectator.dispatchFakeEvent(requireDirtySpectator.query('form')!, 'submit');

      expect(submitHandlerSpy).not.toHaveBeenCalled();
    });

    it('allows submit once the form has been edited', async () => {
      const requireDirtySpectator = createRequireDirtyComponent();
      const requireDirtyLoader = TestbedHarnessEnvironment.loader(requireDirtySpectator.fixture);
      const form = await requireDirtyLoader.getHarness(IxFormHarness);
      await form.fillForm({ Name: 'Edited' });

      const saveButton = await requireDirtyLoader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(submitHandlerSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('extraDisabled', () => {
    @Component({
      template: `
        <ix-form
          [formGroup]="form"
          [title]="'Extra Disabled'"
          [extraDisabled]="extraDisabled()"
          [requiredRoles]="[role]"
          [submitHandler]="handleSubmit"
        >
          <ix-fieldset>
            <ix-input formControlName="name" [label]="'Name'" />
          </ix-fieldset>
        </ix-form>
      `,
      standalone: true,
      changeDetection: ChangeDetectionStrategy.OnPush,
      selector: 'ix-extra-disabled-host',
      imports: [ReactiveFormsModule, IxFormComponent, IxInputComponent, IxFieldsetComponent],
    })
    class ExtraDisabledHostComponent {
      ixForm = viewChild.required(IxFormComponent);
      role = Role.FullAdmin;
      extraDisabled = signal(true);

      private fb = inject(FormBuilder);

      form = this.fb.group({ name: ['filled'] });

      handleSubmit = (event: FormSubmitEvent): SubmitResult => submitHandlerSpy(event);
    }

    const createExtraDisabledComponent = createComponentFactory({
      component: ExtraDisabledHostComponent,
      imports: [ReactiveFormsModule],
      providers: [
        ...ixFormTestingProviders(),
        mockProvider(SlideInRef, slideInRef),
        mockAuth(),
      ],
    });

    it('disables Save when extraDisabled is true and re-enables when it flips', async () => {
      const extraSpectator = createExtraDisabledComponent();
      const extraLoader = TestbedHarnessEnvironment.loader(extraSpectator.fixture);
      const saveButton = await extraLoader.getHarness(MatButtonHarness.with({ text: 'Save' }));

      expect(await saveButton.isDisabled()).toBe(true);

      extraSpectator.component.extraDisabled.set(false);
      extraSpectator.detectChanges();

      expect(await saveButton.isDisabled()).toBe(false);
    });

    it('ignores Enter-key submit while extraDisabled is true', () => {
      const extraSpectator = createExtraDisabledComponent();

      extraSpectator.dispatchFakeEvent(extraSpectator.query('form')!, 'submit');

      expect(submitHandlerSpy).not.toHaveBeenCalled();
    });
  });

  describe('transformEditData', () => {
    interface MismatchedEntity {
      label: string;
      meta: { nestedDescription: string };
    }

    @Component({
      template: `
        <ix-form
          [formGroup]="form"
          [editData]="entity"
          [transformEditData]="transform"
          [title]="'Transform'"
          [requiredRoles]="[role]"
          [submitHandler]="handleSubmit"
        >
          <ix-fieldset>
            <ix-input formControlName="name" [label]="'Name'" />
            <ix-input formControlName="description" [label]="'Description'" />
          </ix-fieldset>
        </ix-form>
      `,
      standalone: true,
      changeDetection: ChangeDetectionStrategy.OnPush,
      selector: 'ix-transform-host',
      imports: [ReactiveFormsModule, IxFormComponent, IxInputComponent, IxFieldsetComponent],
    })
    class TransformHostComponent {
      ixForm = viewChild.required(IxFormComponent);
      role = Role.FullAdmin;

      entity: MismatchedEntity = {
        label: 'Renamed',
        meta: { nestedDescription: 'From nested' },
      };

      transform = (data: unknown): Record<string, unknown> => {
        const entity = data as MismatchedEntity;
        return {
          name: entity.label,
          description: entity.meta.nestedDescription,
        };
      };

      private fb = inject(FormBuilder);

      form = this.fb.group({
        name: [''],
        description: [''],
      });

      handleSubmit = (event: FormSubmitEvent): SubmitResult => submitHandlerSpy(event);
    }

    const createTransformComponent = createComponentFactory({
      component: TransformHostComponent,
      imports: [ReactiveFormsModule],
      providers: [
        ...ixFormTestingProviders(),
        mockProvider(SlideInRef, slideInRef),
        mockAuth(),
      ],
    });

    it('runs the transform before patching the form', () => {
      const transformSpectator = createTransformComponent();
      expect(transformSpectator.component.form.getRawValue()).toEqual({
        name: 'Renamed',
        description: 'From nested',
      });
    });

    it('captures the transformed result as the diff baseline', async () => {
      const transformSpectator = createTransformComponent();
      const transformLoader = TestbedHarnessEnvironment.loader(transformSpectator.fixture);

      const form = await transformLoader.getHarness(IxFormHarness);
      await form.fillForm({ Name: 'Edited' });

      const saveButton = await transformLoader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(submitHandlerSpy).toHaveBeenCalledWith(
        expect.objectContaining({ changedValues: { name: 'Edited' } }),
      );
    });
  });

  describe('preSubmit', () => {
    @Component({
      template: `
        <ix-form
          [formGroup]="form"
          [title]="'PreSubmit'"
          [requiredRoles]="[role]"
          [preSubmit]="preSubmit()"
          [submitHandler]="handleSubmit"
        >
          <ix-fieldset>
            <ix-input formControlName="name" [label]="'Name'" />
          </ix-fieldset>
        </ix-form>
      `,
      standalone: true,
      changeDetection: ChangeDetectionStrategy.OnPush,
      selector: 'ix-pre-submit-host',
      imports: [ReactiveFormsModule, IxFormComponent, IxInputComponent, IxFieldsetComponent],
    })
    class PreSubmitHostComponent {
      ixForm = viewChild.required(IxFormComponent);
      role = Role.FullAdmin;
      // Signal so tests can swap the hook between cases — reassigning a plain
      // class field after init isn't picked up by the wrapper's `input()`.
      preSubmit = signal<((event: FormSubmitEvent) => FormSubmitEvent | false) | null>(null);

      private fb = inject(FormBuilder);

      form = this.fb.group({ name: ['initial'] });

      handleSubmit = (event: FormSubmitEvent): SubmitResult => submitHandlerSpy(event);
    }

    const createPreSubmitComponent = createComponentFactory({
      component: PreSubmitHostComponent,
      imports: [ReactiveFormsModule],
      providers: [
        ...ixFormTestingProviders(),
        mockProvider(SlideInRef, slideInRef),
        mockAuth(),
      ],
    });

    it('forwards the transformed event to submitHandler', async () => {
      const preSubmitSpectator = createPreSubmitComponent();
      preSubmitSpectator.component.preSubmit.set((event) => ({
        ...event,
        allValues: { ...event.allValues, name: 'overridden' },
      }));
      preSubmitSpectator.detectChanges();
      const preSubmitLoader = TestbedHarnessEnvironment.loader(preSubmitSpectator.fixture);

      const saveButton = await preSubmitLoader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(submitHandlerSpy).toHaveBeenCalledWith(
        expect.objectContaining({ allValues: { name: 'overridden' } }),
      );
    });

    it('cancels the submit when preSubmit returns false', async () => {
      const preSubmitSpectator = createPreSubmitComponent();
      preSubmitSpectator.component.preSubmit.set(() => false);
      preSubmitSpectator.detectChanges();
      const preSubmitLoader = TestbedHarnessEnvironment.loader(preSubmitSpectator.fixture);

      const saveButton = await preSubmitLoader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(submitHandlerSpy).not.toHaveBeenCalled();
      expect(slideInRef.close).not.toHaveBeenCalled();
    });
  });

  describe('onCancel', () => {
    @Component({
      template: `
        <ix-form
          [formGroup]="form"
          [title]="'Cancel'"
          [requiredRoles]="[role]"
          [onCancel]="onCancel"
          [submitHandler]="handleSubmit"
        >
          <ix-fieldset>
            <ix-input formControlName="name" [label]="'Name'" />
          </ix-fieldset>
        </ix-form>
      `,
      standalone: true,
      changeDetection: ChangeDetectionStrategy.OnPush,
      selector: 'ix-cancel-host',
      imports: [ReactiveFormsModule, IxFormComponent, IxInputComponent, IxFieldsetComponent],
    })
    class CancelHostComponent {
      ixForm = viewChild.required(IxFormComponent);
      role = Role.FullAdmin;
      onCancel = jest.fn();

      private fb = inject(FormBuilder);

      form = this.fb.group({ name: [''] });

      handleSubmit = (event: FormSubmitEvent): SubmitResult => submitHandlerSpy(event);
    }

    const createCancelComponent = createComponentFactory({
      component: CancelHostComponent,
      imports: [ReactiveFormsModule],
      providers: [
        ...ixFormTestingProviders(),
        mockProvider(SlideInRef, slideInRef),
        mockAuth(),
      ],
    });

    it('fires when the component is destroyed without a submit', () => {
      const cancelSpectator = createCancelComponent();
      const onCancelFn = cancelSpectator.component.onCancel;

      cancelSpectator.fixture.destroy();

      expect(onCancelFn).toHaveBeenCalledTimes(1);
    });

    it('does NOT fire when the component is destroyed after a successful submit', async () => {
      const cancelSpectator = createCancelComponent();
      const onCancelFn = cancelSpectator.component.onCancel;
      const cancelLoader = TestbedHarnessEnvironment.loader(cancelSpectator.fixture);

      const saveButton = await cancelLoader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      cancelSpectator.fixture.destroy();

      expect(onCancelFn).not.toHaveBeenCalled();
    });
  });

  describe('suppressSuccessSnackbar', () => {
    @Component({
      template: `
        <ix-form
          [formGroup]="form"
          [title]="'Suppressed'"
          [suppressSuccessSnackbar]="true"
          [requiredRoles]="[role]"
          [submitHandler]="handleSubmit"
        >
          <ix-fieldset>
            <ix-input formControlName="name" [label]="'Name'" />
          </ix-fieldset>
        </ix-form>
      `,
      standalone: true,
      changeDetection: ChangeDetectionStrategy.OnPush,
      selector: 'ix-suppress-host',
      imports: [ReactiveFormsModule, IxFormComponent, IxInputComponent, IxFieldsetComponent],
    })
    class SuppressHostComponent {
      ixForm = viewChild.required(IxFormComponent);
      role = Role.FullAdmin;

      private fb = inject(FormBuilder);

      form = this.fb.group({ name: [''] });

      handleSubmit = (event: FormSubmitEvent): SubmitResult => submitHandlerSpy(event);
    }

    const createSuppressComponent = createComponentFactory({
      component: SuppressHostComponent,
      imports: [ReactiveFormsModule],
      providers: [
        ...ixFormTestingProviders(),
        mockProvider(SlideInRef, slideInRef),
        mockAuth(),
      ],
    });

    it('skips the snackbar but still closes the slide-in on success', async () => {
      const apiResult = { id: 1 };
      submitHandlerSpy.mockReturnValue({
        request$: of(apiResult),
        successMessage: 'Saved!' as TranslatedString,
      });

      const suppressSpectator = createSuppressComponent();
      const suppressLoader = TestbedHarnessEnvironment.loader(suppressSpectator.fixture);

      const saveButton = await suppressLoader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(suppressSpectator.inject(SnackbarService).success).not.toHaveBeenCalled();
      expect(slideInRef.close).toHaveBeenCalledWith({ response: apiResult });
    });

    it('still invokes onSuccess when the snackbar is suppressed', async () => {
      const onSuccessSpy = jest.fn();
      const apiResult = { id: 1 };
      submitHandlerSpy.mockReturnValue({
        request$: of(apiResult),
        successMessage: 'Saved!' as TranslatedString,
        onSuccess: onSuccessSpy,
      });

      const suppressSpectator = createSuppressComponent();
      const suppressLoader = TestbedHarnessEnvironment.loader(suppressSpectator.fixture);

      const saveButton = await suppressLoader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(onSuccessSpy).toHaveBeenCalledWith(apiResult);
      expect(suppressSpectator.inject(SnackbarService).success).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('handles errors from submitHandler request', async () => {
      const error = new Error('Validation failed');
      submitHandlerSpy.mockReturnValue({
        request$: throwError(() => error),
        successMessage: 'Saved!' as TranslatedString,
      });

      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      // Save button re-enables after the error path runs.
      expect(await saveButton.isDisabled()).toBe(false);
      expect(spectator.inject(FormErrorHandlerService).handleValidationErrors)
        .toHaveBeenCalledWith(error, spectator.component.form);
    });

    it('skips default error handling when onError returns true', async () => {
      const error = new Error('Custom handled');
      const onErrorSpy = jest.fn(() => true);
      submitHandlerSpy.mockReturnValue({
        request$: throwError(() => error),
        successMessage: 'Saved!' as TranslatedString,
        onError: onErrorSpy,
      });

      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(onErrorSpy).toHaveBeenCalledWith(error);
      expect(spectator.inject(FormErrorHandlerService).handleValidationErrors).not.toHaveBeenCalled();
    });

    it('falls back to default error handling when onError returns false', async () => {
      const error = new Error('Not handled');
      const onErrorSpy = jest.fn(() => false);
      submitHandlerSpy.mockReturnValue({
        request$: throwError(() => error),
        successMessage: 'Saved!' as TranslatedString,
        onError: onErrorSpy,
      });

      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(onErrorSpy).toHaveBeenCalledWith(error);
      expect(spectator.inject(FormErrorHandlerService).handleValidationErrors)
        .toHaveBeenCalledWith(error, spectator.component.form);
    });

    it('does not fire success lifecycle if request errors after emitting', async () => {
      const error = new Error('After emit');
      const onSuccessSpy = jest.fn();
      submitHandlerSpy.mockReturnValue({
        request$: concat(of('first'), throwError(() => error)),
        successMessage: 'Saved!' as TranslatedString,
        onSuccess: onSuccessSpy,
      });

      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      // next should settle the subscription, error afterwards should be ignored
      expect(onSuccessSpy).toHaveBeenCalledTimes(1);
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalledTimes(1);
      expect(spectator.inject(FormErrorHandlerService).handleValidationErrors).not.toHaveBeenCalled();
    });
  });

  describe('auto title and extra actions', () => {
    const createAutoTitleComponent = createComponentFactory({
      component: AutoTitleHostComponent,
      imports: [ReactiveFormsModule],
      providers: [
        ...ixFormTestingProviders(),
        mockProvider(SlideInRef, slideInRef),
        mockAuth(),
      ],
    });

    it('uses addTitle in create mode', () => {
      const autoTitleSpectator = createAutoTitleComponent();
      const ixForm = autoTitleSpectator.component.ixForm();
      expect(ixForm.resolvedTitle()).toBe('Add Group');
    });

    it('uses editTitle in edit mode', () => {
      const autoTitleSpectator = createAutoTitleComponent({ detectChanges: false });
      autoTitleSpectator.component.editData = { name: 'wheel' };
      autoTitleSpectator.detectChanges();
      const ixForm = autoTitleSpectator.component.ixForm();
      expect(ixForm.resolvedTitle()).toBe('Edit Group');
    });

    it('renders extra action buttons via ixExtraActions slot', () => {
      const autoTitleSpectator = createAutoTitleComponent();
      const extraButton = autoTitleSpectator.query('button[ixExtraActions]');
      expect(extraButton).toBeTruthy();
      expect(extraButton).toHaveText('Advanced Options');
    });

    it('prefers explicit title over addTitle/editTitle', () => {
      spectator = createComponent();
      const ixForm = spectator.component.ixForm();
      expect(ixForm.resolvedTitle()).toBe('Test Form');
    });
  });

  describe('external loading', () => {
    @Component({
      template: `
        <ix-form
          [formGroup]="form"
          [title]="'External'"
          [externalLoading]="externalLoading()"
          [requiredRoles]="[role]"
          [submitHandler]="handleSubmit"
        >
          <ix-fieldset>
            <ix-input formControlName="name" [label]="'Name'" />
          </ix-fieldset>
        </ix-form>
      `,
      standalone: true,
      changeDetection: ChangeDetectionStrategy.OnPush,
      selector: 'ix-external-loading-host',
      imports: [ReactiveFormsModule, IxFormComponent, IxInputComponent, IxFieldsetComponent],
    })
    class ExternalLoadingHostComponent {
      ixForm = viewChild.required(IxFormComponent);
      role = Role.FullAdmin;
      externalLoading = signal(false);

      private fb = inject(FormBuilder);

      form = this.fb.group({
        name: [''],
      });

      handleSubmit = (event: FormSubmitEvent): SubmitResult => submitHandlerSpy(event);
    }

    const createExternalLoadingComponent = createComponentFactory({
      component: ExternalLoadingHostComponent,
      imports: [ReactiveFormsModule],
      providers: [
        ...ixFormTestingProviders(),
        mockProvider(SlideInRef, slideInRef),
        mockAuth(),
      ],
    });

    it('reflects externalLoading in isLoading and disables save', async () => {
      const externalSpectator = createExternalLoadingComponent();
      const loader2 = TestbedHarnessEnvironment.loader(externalSpectator.fixture);

      const ixForm = externalSpectator.component.ixForm();
      expect(ixForm.isLoading()).toBe(false);

      externalSpectator.component.externalLoading.set(true);
      externalSpectator.detectChanges();

      expect(ixForm.isLoading()).toBe(true);

      const saveButton = await loader2.getHarness(MatButtonHarness.with({ text: 'Save' }));
      expect(await saveButton.isDisabled()).toBe(true);

      externalSpectator.component.externalLoading.set(false);
      externalSpectator.detectChanges();

      expect(ixForm.isLoading()).toBe(false);
      expect(await saveButton.isDisabled()).toBe(false);
    });
  });

  describe('initialFormSnapshot precedence', () => {
    @Component({
      template: `
        <ix-form
          [formGroup]="form"
          [editData]="editData"
          [initialFormSnapshot]="snapshot"
          [title]="'Snap'"
          [requiredRoles]="[role]"
          [submitHandler]="handleSubmit"
        >
          <ix-fieldset>
            <ix-input formControlName="name" [label]="'Name'" />
          </ix-fieldset>
        </ix-form>
      `,
      standalone: true,
      changeDetection: ChangeDetectionStrategy.OnPush,
      selector: 'ix-snapshot-host',
      imports: [ReactiveFormsModule, IxFormComponent, IxInputComponent, IxFieldsetComponent],
    })
    class SnapshotHostComponent {
      ixForm = viewChild.required(IxFormComponent);
      role = Role.FullAdmin;
      editData = { name: 'FromEditData' };
      snapshot: Record<string, unknown> = { name: 'FromSnapshot' };

      private fb = inject(FormBuilder);

      form = this.fb.group({ name: [''] });

      handleSubmit = (): SubmitResult => ({
        request$: of(undefined),
        successMessage: 'Saved!' as TranslatedString,
      });
    }

    const createSnapshotComponent = createComponentFactory({
      component: SnapshotHostComponent,
      imports: [ReactiveFormsModule],
      providers: [
        ...ixFormTestingProviders(),
        mockProvider(SlideInRef, slideInRef),
        mockAuth(),
      ],
    });

    it('skips editData auto-patch when initialFormSnapshot is provided', () => {
      const snapshotSpectator = createSnapshotComponent();
      expect(snapshotSpectator.component.form.value).toEqual({ name: '' });
      expect(snapshotSpectator.component.ixForm().isEdit()).toBe(true);
    });
  });

  describe('isEditMode override', () => {
    @Component({
      template: `
        <ix-form
          [formGroup]="form"
          [initialFormSnapshot]="snapshot"
          [isEditMode]="editMode"
          [addTitle]="'Add X'"
          [editTitle]="'Edit X'"
          [requiredRoles]="[role]"
          [submitHandler]="handleSubmit"
        >
          <ix-fieldset>
            <ix-input formControlName="name" [label]="'Name'" />
          </ix-fieldset>
        </ix-form>
      `,
      standalone: true,
      changeDetection: ChangeDetectionStrategy.OnPush,
      selector: 'ix-edit-mode-host',
      imports: [ReactiveFormsModule, IxFormComponent, IxInputComponent, IxFieldsetComponent],
    })
    class EditModeHostComponent {
      ixForm = viewChild.required(IxFormComponent);
      role = Role.FullAdmin;
      snapshot: Record<string, unknown> | null = null;
      editMode: boolean | null = true;

      private fb = inject(FormBuilder);

      form = this.fb.group({ name: [''] });

      handleSubmit = (): SubmitResult => ({
        request$: of(undefined),
        successMessage: 'Saved!' as TranslatedString,
      });
    }

    const createEditModeComponent = createComponentFactory({
      component: EditModeHostComponent,
      imports: [ReactiveFormsModule],
      providers: [
        ...ixFormTestingProviders(),
        mockProvider(SlideInRef, slideInRef),
        mockAuth(),
      ],
    });

    it('reports edit mode before snapshot loads when isEditMode is true', () => {
      const editSpectator = createEditModeComponent();
      const ixForm = editSpectator.component.ixForm();
      expect(ixForm.isEdit()).toBe(true);
      expect(ixForm.resolvedTitle()).toBe('Edit X');
    });

    it('overrides inferred edit state when isEditMode is false', () => {
      const editSpectator = createEditModeComponent({ detectChanges: false });
      editSpectator.component.editMode = false;
      editSpectator.component.snapshot = { name: 'existing' };
      editSpectator.detectChanges();

      const ixForm = editSpectator.component.ixForm();
      expect(ixForm.isEdit()).toBe(false);
      expect(ixForm.resolvedTitle()).toBe('Add X');
    });
  });

  describe('canSubmit (host-owned Save)', () => {
    it('stays submittable while async validators are pending, not only when VALID', () => {
      spectator = createComponent();
      const form = spectator.component.form;

      // An edit form runs async validators (e.g. name/path uniqueness) against unchanged,
      // already-valid data on open; hold a control PENDING as those in-flight checks do
      // before they settle.
      form.controls.name.setAsyncValidators(() => NEVER);
      form.controls.name.updateValueAndValidity();
      spectator.detectChanges();

      expect(form.status).toBe('PENDING');
      // Regression: gating on `formStatus === 'VALID'` disabled the `<tn-side-panel>` footer
      // Save through this window ("Save disabled until I change something" on WebShare Edit).
      expect(spectator.component.ixForm().canSubmit()).toBe(true);
    });

    it('is not submittable while INVALID', () => {
      spectator = createComponent();
      const form = spectator.component.form;

      form.controls.name.setValidators(Validators.required);
      form.controls.name.setValue('');
      form.controls.name.updateValueAndValidity();
      spectator.detectChanges();

      expect(form.status).toBe('INVALID');
      expect(spectator.component.ixForm().canSubmit()).toBe(false);
    });
  });

  describe('minimum submit feedback (side-panel host)', () => {
    // No SlideInRef provided → the form is hosted in a `<tn-side-panel>`, where success is held for
    // a minimum duration so the host's progress bar / dim overlay stay visible long enough to see.
    const createSidePanelComponent = createComponentFactory({
      component: TestHostComponent,
      imports: [ReactiveFormsModule],
      providers: [
        ...ixFormTestingProviders(),
        // Force the `<tn-side-panel>` host: no SlideInRef (the harness would otherwise auto-mock
        // one, taking the un-delayed legacy path). `null` is what `inject(…, {optional:true})` sees.
        { provide: SlideInRef, useValue: null },
        mockAuth(),
      ],
    });

    it('holds submitting and defers close + snackbar until the minimum duration elapses', fakeAsync(() => {
      submitHandlerSpy.mockReturnValue({
        request$: of({ id: 1 }),
        successMessage: 'Saved!' as TranslatedString,
      });

      const sidePanelSpectator = createSidePanelComponent();
      const ixForm = sidePanelSpectator.component.ixForm();
      const closedSpy = jest.fn();
      ixForm.closed.subscribe(closedSpy);

      ixForm.submit();

      // The request resolves synchronously, but success handling waits on the min-duration timer:
      // the loader stays up and nothing closes yet.
      expect(ixForm.isSubmitting()).toBe(true);
      expect(closedSpy).not.toHaveBeenCalled();
      expect(sidePanelSpectator.inject(SnackbarService).success).not.toHaveBeenCalled();

      tick(499);
      expect(ixForm.isSubmitting()).toBe(true);
      expect(closedSpy).not.toHaveBeenCalled();

      tick(1);
      expect(ixForm.isSubmitting()).toBe(false);
      expect(closedSpy).toHaveBeenCalledWith(true);
      expect(sidePanelSpectator.inject(SnackbarService).success).toHaveBeenCalledWith('Saved!');
    }));

    it('surfaces a submit error immediately, without waiting out the minimum duration', fakeAsync(() => {
      submitHandlerSpy.mockReturnValue({
        request$: throwError(() => new Error('nope')),
        successMessage: 'Saved!' as TranslatedString,
      });

      const sidePanelSpectator = createSidePanelComponent();
      const ixForm = sidePanelSpectator.component.ixForm();

      ixForm.submit();

      expect(ixForm.isSubmitting()).toBe(false);
      expect(sidePanelSpectator.inject(FormErrorHandlerService).handleValidationErrors).toHaveBeenCalled();
    }));
  });
});
