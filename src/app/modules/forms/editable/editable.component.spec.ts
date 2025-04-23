import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { fakeAsync, tick } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { createHostFactory, mockProvider, SpectatorHost } from '@ngneat/spectator/jest';
import { EditableComponent } from 'app/modules/forms/editable/editable.component';
import { EditableHarness } from 'app/modules/forms/editable/editable.harness';
import { EditableService } from 'app/modules/forms/editable/services/editable.service';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';

describe('EditableComponent', () => {
  let spectator: SpectatorHost<EditableComponent>;
  let loader: HarnessLoader;
  let editable: EditableHarness;

  const createHost = createHostFactory({
    component: EditableComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(EditableService),
    ],
  });

  const nameControl = new FormControl('Robert');

  beforeEach(async () => {
    nameControl.setValue('Robert');
    spectator = createHost(
      `
        <ix-editable [emptyValue]="emptyValue">
          <div view>
            {{ nameControl.value }}
          </div>

          <div edit>
            <ix-input [formControl]="nameControl"></ix-input>
          </div>
        </ix-editable>
      `,
      {
        hostProps: {
          nameControl,
          emptyValue: 'Not Set',
        },
      },
    );

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    editable = await loader.getHarness(EditableHarness);
  });

  describe('view mode', () => {
    it('shows value in the view slot', async () => {
      expect(await editable.getShownValue()).toBe('Robert');
    });

    it('shows new values as it is changed', async () => {
      nameControl.setValue('Juan');

      expect(await editable.getShownValue()).toBe('Juan');
    });

    it('shows empty value when no value is rendered', async () => {
      nameControl.setValue('');

      expect(await editable.getShownValue()).toBe('Not Set');
    });

    it('shows a pencil icon', async () => {
      const icon = await editable.getHarness(IxIconHarness);
      expect(await icon.getName()).toBe('mdi-pencil');
    });

    it('switches to editable mode when view value is clicked', async () => {
      const trigger = await editable.getTrigger();
      await trigger.click();

      expect(await editable.isOpen()).toBe(true);
    });
  });

  describe('edit mode', () => {
    it('shows control from the edit slot', async () => {
      await editable.open();
      const input = await editable.getHarness(IxInputHarness);
      expect(input).toExist();
      expect(await input.getValue()).toBe('Robert');
    });

    it('focuses on the first focusable element when switching to edit mode', fakeAsync(async () => {
      await editable.open();
      tick();

      const input = await editable.getHarness(IxInputHarness);
      expect(await (await input.getMatInputHarness()).isFocused()).toBe(true);
    }));
  });

  describe('interactions', () => {
    it('registers component with editable service on init', () => {
      expect(spectator.inject(EditableService).register).toHaveBeenCalledWith(expect.any(EditableComponent));
    });
  });

  describe('tryToClose', () => {
    it('closes the editable if there are no validation errors', async () => {
      await editable.open();
      spectator.component.tryToClose();

      expect(await editable.isOpen()).toBe(false);
    });

    it('does not change editable state if it is already closed', async () => {
      spectator.component.tryToClose();

      expect(await editable.isOpen()).toBe(false);
    });

    it('does not close the editable when there are validation errors on controls', async () => {
      await editable.open();

      nameControl.setErrors({ required: true });
      spectator.component.tryToClose();

      expect(await editable.isOpen()).toBe(true);
    });
  });

  describe('hasControl', () => {
    it('returns true if control is part of the controls rendered within editable', () => {
      expect(spectator.component.hasControl(nameControl)).toBe(true);

      const missingControl = new FormControl('');
      expect(spectator.component.hasControl(missingControl)).toBe(false);
    });
  });

  describe('isElementWithin', () => {
    it('returns true when target is part of the editable', () => {
      const innerElement = spectator.query<HTMLElement>('.edit-trigger');

      expect(spectator.component.isElementWithin(innerElement)).toBe(true);
    });
  });
});
