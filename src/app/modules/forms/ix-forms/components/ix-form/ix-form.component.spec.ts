/* eslint-disable @angular-eslint/component-max-inline-declarations, max-classes-per-file */
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest'; // cspell:ignore ngneat
import {
  concat, EMPTY, firstValueFrom, Observable, of, throwError,
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
  // The host components below reference this via a closure inside handleSubmit
  // (e.g. `(event) => submitHandlerSpy(event)`) rather than binding the spy
  // directly. That indirection is load-bearing: the spy is reassigned in each
  // `beforeEach`, and a direct binding (`handleSubmit = submitHandlerSpy`)
  // would capture the outer reference once at class-field init time and never
  // see later reassignments. Do not "simplify" by removing the lambda.
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

  // Shared across describe blocks, so spies must be reset per test — otherwise
  // cross-test call counts leak and assertions like `toHaveBeenCalledTimes(1)`
  // silently drift.
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
    it('does not call submitHandler when submit fires while loading', () => {
      spectator = createComponent();
      spectator.component.ixForm().isSubmitting.set(true);

      spectator.dispatchFakeEvent(spectator.query('form')!, 'submit');

      expect(submitHandlerSpy).not.toHaveBeenCalled();
    });

    it('does not call submitHandler when submit fires with an invalid form', () => {
      spectator = createComponent();
      spectator.component.form.controls.name.setErrors({ required: true });

      spectator.dispatchFakeEvent(spectator.query('form')!, 'submit');

      expect(submitHandlerSpy).not.toHaveBeenCalled();
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

      const ixForm = spectator.component.ixForm();
      expect(ixForm.isSubmitting()).toBe(false);
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
});
