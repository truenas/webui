import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { fakeAsync, tick } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { createHostFactory, SpectatorHost } from '@ngneat/spectator/jest';
import { TranslateModule } from '@ngx-translate/core';
import { EditableComponent } from 'app/modules/forms/editable/editable.component';
import { EditableHarness } from 'app/modules/forms/editable/editable.harness';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
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

    it('stores previously focused element when opening', async () => {
      const focusedElement = document.createElement('input');
      document.body.appendChild(focusedElement);
      focusedElement.focus();

      await editable.open();

      expect(spectator.component.previouslyFocusedElement).toBe(focusedElement);

      document.body.removeChild(focusedElement);
    });

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
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

      spectator.component.ngOnDestroy();

      expect(removeEventListenerSpy).toHaveBeenCalled();
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
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

      spectator.component.ngOnDestroy();

      expect(removeEventListenerSpy).toHaveBeenCalled();
    });
  });
});
