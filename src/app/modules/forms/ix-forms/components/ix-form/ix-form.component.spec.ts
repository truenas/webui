/* eslint-disable @angular-eslint/component-max-inline-declarations, max-classes-per-file */
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ChangeDetectionStrategy, Component, inject, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { EMPTY, of, throwError } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Role } from 'app/enums/role.enum';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { FormSubmitEvent, IxFormComponent, SubmitResult } from './ix-form.component';

describe('IxFormComponent', () => {
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

  const slideInRef: SlideInRef<undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn((): undefined => undefined),
  };

  const createComponent = createComponentFactory({
    component: TestHostComponent,
    imports: [ReactiveFormsModule],
    providers: [
      mockProvider(FormErrorHandlerService),
      mockProvider(SnackbarService),
      mockProvider(SlideIn, {
        openSlideIns: jest.fn(() => 1),
      }),
      mockProvider(SlideInRef, slideInRef),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    submitHandlerSpy = jest.fn<SubmitResult, [FormSubmitEvent]>(() => ({
      request$: of(undefined),
      successMessage: 'Saved!' as never,
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
        successMessage: 'Saved!' as never,
        onSuccess: onSuccessSpy,
      });

      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(onSuccessSpy).toHaveBeenCalledWith(apiResult);
    });

    it('resets isSubmitting when observable completes without emitting', async () => {
      submitHandlerSpy.mockReturnValue({
        request$: EMPTY,
        successMessage: 'Saved!' as never,
      });

      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      const ixForm = spectator.component.ixForm();
      expect(ixForm.isSubmitting()).toBe(false);
      expect(spectator.inject(SnackbarService).success).not.toHaveBeenCalled();
      expect(slideInRef.close).not.toHaveBeenCalled();
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
  });

  describe('dirty confirmation', () => {
    it('registers dirty confirmation with SlideInRef', () => {
      createComponent();
      expect(slideInRef.requireConfirmationWhen).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('handles errors from submitHandler request', async () => {
      const error = new Error('Validation failed');
      submitHandlerSpy.mockReturnValue({
        request$: throwError(() => error),
        successMessage: 'Saved!' as never,
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
  });

  describe('auto title and extra actions', () => {
    const createAutoTitleComponent = createComponentFactory({
      component: AutoTitleHostComponent,
      imports: [ReactiveFormsModule],
      providers: [
        mockProvider(FormErrorHandlerService),
        mockProvider(SnackbarService),
        mockProvider(SlideIn, {
          openSlideIns: jest.fn(() => 1),
        }),
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
  });
});
