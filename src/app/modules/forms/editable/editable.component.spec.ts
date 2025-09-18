import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { fakeAsync, tick, flushMicrotasks } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { createHostFactory, SpectatorHost } from '@ngneat/spectator/jest';
import { TranslateModule } from '@ngx-translate/core';
import { EditableComponent } from 'app/modules/forms/editable/editable.component';
import { EditableHarness } from 'app/modules/forms/editable/editable.harness';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { ValidationErrorCommunicationService } from 'app/modules/forms/validation-error-communication.service';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';

describe('EditableComponent', () => {
  let spectator: SpectatorHost<EditableComponent>;
  let loader: HarnessLoader;
  let editable: EditableHarness;

  beforeAll(() => {
    // Mock scrollIntoView for all tests
    Object.defineProperty(Element.prototype, 'scrollIntoView', {
      value: jest.fn(),
      writable: true,
    });
  });

  const createHost = createHostFactory({
    component: EditableComponent,
    imports: [
      ReactiveFormsModule,
      TranslateModule.forRoot(),
    ],
  });

  const nameControl = new FormControl('Robert');

  beforeEach(async () => {
    nameControl.setValue('Robert');
    nameControl.setErrors(null);
    nameControl.markAsPristine();
    nameControl.markAsUntouched();
    spectator = createHost(
      `
        <ix-editable
          [emptyValue]="emptyValue"
          [readonly]="readonly"
          [disabled]="disabled"
        >
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
          readonly: false,
          disabled: false,
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

    it('applies readonly class when editable is readonly', () => {
      spectator.setHostInput({ readonly: true });

      expect(spectator.query('.edit-trigger')).toHaveClass('readonly');
    });

    it('applies disabled class when editable is disabled', () => {
      spectator.setHostInput({ disabled: true });

      expect(spectator.query('.edit-trigger')).toHaveClass('disabled');
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

    it('scrolls edit slot into view when opening', fakeAsync(async () => {
      const scrollIntoViewSpy = jest.spyOn(Element.prototype, 'scrollIntoView');

      await editable.open();
      tick();

      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'center',
      });
    }));


    it('restores focus to previously focused element when closing', fakeAsync(async () => {
      const focusedElement = document.createElement('input');
      document.body.appendChild(focusedElement);
      focusedElement.focus();

      await editable.open();
      spectator.component.tryToClose();
      tick();

      expect(document.activeElement).toBe(focusedElement);

      document.body.removeChild(focusedElement);
    }));
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

  describe('click outside functionality', () => {
    it('closes editable when clicking outside', fakeAsync(async () => {
      await editable.open();
      expect(await editable.isOpen()).toBe(true);

      // Simulate click outside by mocking isElementWithin
      jest.spyOn(spectator.component, 'isElementWithin').mockReturnValue(false);
      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', { value: document.createElement('div') });

      document.dispatchEvent(clickEvent);
      tick();

      expect(await editable.isOpen()).toBe(false);
    }));

    it('does not close when clicking inside the editable', fakeAsync(async () => {
      await editable.open();
      expect(await editable.isOpen()).toBe(true);

      // Simulate click inside by mocking isElementWithin
      jest.spyOn(spectator.component, 'isElementWithin').mockReturnValue(true);
      const clickEvent = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(clickEvent, 'target', { value: document.createElement('div') });

      document.dispatchEvent(clickEvent);
      tick();

      expect(await editable.isOpen()).toBe(true);
    }));

    it('removes click outside listener when closing', fakeAsync(async () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

      await editable.open();
      spectator.component.tryToClose();
      tick();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function), { capture: true });
    }));

    it('removes click outside listener on destroy', () => {
      // Open editable to create a subscription
      spectator.component.open();

      // Spy on the subscription's unsubscribe method
      const clickOutsideSubscription = (spectator.component as unknown as {
        clickOutsideSubscription: { unsubscribe: () => void };
      }).clickOutsideSubscription;
      const unsubscribeSpy = jest.spyOn(clickOutsideSubscription, 'unsubscribe');

      spectator.component.ngOnDestroy();

      expect(unsubscribeSpy).toHaveBeenCalled();
    });
  });

  describe('keyboard functionality', () => {
    it('closes editable when Escape key is pressed', fakeAsync(async () => {
      await editable.open();
      expect(await editable.isOpen()).toBe(true);

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      document.dispatchEvent(escapeEvent);
      tick();

      expect(await editable.isOpen()).toBe(false);
    }));

    it('does not close when other keys are pressed', fakeAsync(async () => {
      await editable.open();
      expect(await editable.isOpen()).toBe(true);

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      document.dispatchEvent(enterEvent);
      tick();

      expect(await editable.isOpen()).toBe(true);
    }));

    it('removes keydown listener when closing', fakeAsync(async () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

      await editable.open();
      spectator.component.tryToClose();
      tick();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function), { capture: true });
    }));

    it('removes keydown listener on destroy', () => {
      // Open editable to create a subscription
      spectator.component.open();

      // Spy on the subscription's unsubscribe method
      const keydownSubscription = (spectator.component as unknown as {
        keydownSubscription: { unsubscribe: () => void };
      }).keydownSubscription;
      const unsubscribeSpy = jest.spyOn(keydownSubscription, 'unsubscribe');

      spectator.component.ngOnDestroy();

      expect(unsubscribeSpy).toHaveBeenCalled();
    });
  });

  describe('validation error handling', () => {
    it('auto-opens editable when validation error notification is received and control has errors', fakeAsync(async () => {
      const validationService = spectator.inject(ValidationErrorCommunicationService);

      // Set an error on the form control
      nameControl.setErrors({ required: true });
      nameControl.markAsTouched();

      // Ensure editable is closed
      expect(await editable.isOpen()).toBe(false);

      // Trigger validation error notification
      validationService.notifyValidationError('name');

      // Wait for the timer delay (50ms) and flush microtasks
      tick(50);
      flushMicrotasks();

      // Should auto-open since control has errors
      expect(await editable.isOpen()).toBe(true);
    }));

    it('does not open editable when validation error notification is received but control has no errors', fakeAsync(async () => {
      const validationService = spectator.inject(ValidationErrorCommunicationService);

      // Ensure control has no errors
      nameControl.setErrors(null);

      // Ensure editable is closed
      expect(await editable.isOpen()).toBe(false);

      // Trigger validation error notification
      validationService.notifyValidationError('name');

      // Wait for the setTimeout delay (100ms)
      tick(100);

      // Should not open since control has no errors
      expect(await editable.isOpen()).toBe(false);
    }));

    it('does not open editable when validation error notification is received and editable is already open', fakeAsync(async () => {
      const validationService = spectator.inject(ValidationErrorCommunicationService);

      // Set an error on the form control
      nameControl.setErrors({ required: true });
      nameControl.markAsTouched();

      // Open the editable first
      await editable.open();
      expect(await editable.isOpen()).toBe(true);

      // Spy on the open method to ensure it's not called again
      const openSpy = jest.spyOn(spectator.component, 'open');

      // Trigger validation error notification
      validationService.notifyValidationError('name');

      // Wait for the setTimeout delay (100ms)
      tick(100);

      // Should not call open again since already open
      expect(openSpy).not.toHaveBeenCalled();
      expect(await editable.isOpen()).toBe(true);
    }));

    it('handles validation error notification gracefully when no controls have errors', fakeAsync(async () => {
      const validationService = spectator.inject(ValidationErrorCommunicationService);

      // Ensure control has no errors
      nameControl.setErrors(null);

      // Ensure editable is closed
      expect(await editable.isOpen()).toBe(false);

      // Trigger validation error notification
      validationService.notifyValidationError('someField');

      // Wait for the setTimeout delay (100ms)
      tick(100);

      // Should not open since no controls have errors
      expect(await editable.isOpen()).toBe(false);
    }));

    it('handles empty field name in validation error notification', fakeAsync(async () => {
      const validationService = spectator.inject(ValidationErrorCommunicationService);

      // Ensure editable is closed
      expect(await editable.isOpen()).toBe(false);

      // Trigger validation error notification with empty field name
      validationService.notifyValidationError('');

      // No tick needed since empty field name returns early

      // Should not open since field name is empty
      expect(await editable.isOpen()).toBe(false);
    }));
  });


  describe('error state integration', () => {
    it('maintains closed state when controls have no errors', async () => {
      // Ensure editable starts closed
      expect(await editable.isOpen()).toBe(false);

      // Set up control without errors but with user interaction
      nameControl.setErrors(null);
      nameControl.markAsTouched();
      nameControl.markAsDirty();

      spectator.detectChanges();

      // Should remain closed since there are no errors
      expect(await editable.isOpen()).toBe(false);
    });

    it('can handle control state changes without breaking', async () => {
      // Ensure editable starts closed
      expect(await editable.isOpen()).toBe(false);

      // Simulate various control state changes
      nameControl.markAsTouched();
      nameControl.setErrors({ required: true });
      spectator.detectChanges();

      nameControl.setErrors(null);
      spectator.detectChanges();

      nameControl.markAsDirty();
      spectator.detectChanges();

      // Component should handle all state changes gracefully
      expect(spectator.component).toBeDefined();
      expect(await editable.isOpen()).toBe(false);
    });
  });

  describe('form validation integration', () => {
    it('can be opened and closed programmatically', async () => {
      // Verify initial state
      expect(await editable.isOpen()).toBe(false);

      // Test opening
      spectator.component.open();
      expect(await editable.isOpen()).toBe(true);

      // Test closing
      spectator.component.tryToClose();
      expect(await editable.isOpen()).toBe(false);
    });

    it('prevents closing when there are validation errors', async () => {
      // Open the editable
      await editable.open();
      expect(await editable.isOpen()).toBe(true);

      // Add validation errors
      nameControl.setErrors({ required: true });

      // Try to close - should fail due to validation errors
      spectator.component.tryToClose();
      expect(await editable.isOpen()).toBe(true);
    });

    it('allows closing when validation errors are cleared', async () => {
      // Open the editable with errors
      await editable.open();
      nameControl.setErrors({ required: true });
      expect(await editable.isOpen()).toBe(true);

      // Clear validation errors
      nameControl.setErrors(null);

      // Should now be able to close
      spectator.component.tryToClose();
      expect(await editable.isOpen()).toBe(false);
    });

    it('correctly identifies controls that belong to this editable', () => {
      expect(spectator.component.hasControl(nameControl)).toBe(true);

      const unrelatedControl = new FormControl('unrelated');
      expect(spectator.component.hasControl(unrelatedControl)).toBe(false);
    });
  });
});
