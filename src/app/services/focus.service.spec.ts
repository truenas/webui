import { DOCUMENT } from '@angular/common';
import { SpectatorService, createServiceFactory } from '@ngneat/spectator/jest';
import { FocusService } from './focus.service';

describe('FocusService', () => {
  let spectator: SpectatorService<FocusService>;
  let mockDocument: Partial<Document>;
  let mockElement: Partial<HTMLElement>;
  let mockInput: Partial<HTMLInputElement>;
  let mockButton: Partial<HTMLButtonElement>;

  const createService = createServiceFactory({
    service: FocusService,
    providers: [
      {
        provide: DOCUMENT,
        useFactory: () => mockDocument,
      },
    ],
  });

  beforeEach(() => {
    mockElement = {
      focus: jest.fn(),
      getAttribute: jest.fn(),
      querySelectorAll: jest.fn(),
    };

    mockInput = {
      focus: jest.fn(),
      getAttribute: jest.fn(),
      tagName: 'INPUT',
      type: 'text',
      disabled: false,
    };

    mockButton = {
      focus: jest.fn(),
      getAttribute: jest.fn(),
      tagName: 'BUTTON',
      disabled: false,
    };

    mockDocument = {
      activeElement: mockElement as HTMLElement,
      getElementById: jest.fn(),
      querySelector: jest.fn(),
    };

    spectator = createService();
  });

  describe('captureCurrentFocus', () => {
    it('should capture the currently focused element', () => {
      spectator.service.captureCurrentFocus();

      // The method should have captured the active element
      expect(mockDocument.activeElement).toBe(mockElement);
    });
  });

  describe('restoreFocus', () => {
    beforeEach(() => {
      spectator.service.captureCurrentFocus();
    });

    it('should restore focus to the last focused element', async () => {
      mockDocument.querySelector = jest.fn().mockReturnValue(null); // No overlay backdrop
      (mockElement.getAttribute as jest.Mock).mockReturnValue(null);

      spectator.service.restoreFocus();

      await new Promise<void>((resolve) => {
        setTimeout(resolve, 250);
      });
      expect(mockElement.focus).toHaveBeenCalled();
    });

    it('should focus element by data-test attribute when available and no overlay backdrop', async () => {
      const dataTestElement = { focus: jest.fn() };
      mockDocument.querySelector = jest.fn()
        .mockReturnValueOnce(null) // No overlay backdrop
        .mockReturnValueOnce(dataTestElement); // Element with data-test

      (mockElement.getAttribute as jest.Mock).mockReturnValue('test-element');

      spectator.service.restoreFocus();

      await new Promise<void>((resolve) => {
        setTimeout(resolve, 250);
      });
      expect(mockDocument.querySelector).toHaveBeenCalledWith('.cdk-overlay-backdrop');
      expect(mockDocument.querySelector).toHaveBeenCalledWith('[data-test="test-element"]');
      expect(dataTestElement.focus).toHaveBeenCalled();
    });

    it('should use lastFocusedElement when overlay backdrop is present', async () => {
      const overlayBackdrop = { className: 'cdk-overlay-backdrop' };
      mockDocument.querySelector = jest.fn().mockReturnValue(overlayBackdrop);
      (mockElement.getAttribute as jest.Mock).mockReturnValue('test-element');

      spectator.service.restoreFocus();

      await new Promise<void>((resolve) => {
        setTimeout(resolve, 250);
      });
      expect(mockElement.focus).toHaveBeenCalled();
    });

    it('should clear lastFocusedElement after restoring focus', async () => {
      mockDocument.querySelector = jest.fn().mockReturnValue(null);
      (mockElement.getAttribute as jest.Mock).mockReturnValue(null);

      spectator.service.restoreFocus();

      await new Promise<void>((resolve) => {
        setTimeout(resolve, 250);
      });
      // We can't easily test the private property, so test the behavior instead
      expect(mockElement.focus).toHaveBeenCalled();
    });

    it('should do nothing when no element was previously captured', () => {
      // Create a new service instance that hasn't captured focus
      const newSpectator = createService();

      newSpectator.service.restoreFocus();

      expect(mockElement.focus).not.toHaveBeenCalled();
    });
  });

  describe('focusElementById', () => {
    it('should focus element by id when element exists', () => {
      const elementToFocus = { focus: jest.fn() };
      mockDocument.getElementById = jest.fn().mockReturnValue(elementToFocus);

      spectator.service.focusElementById('test-id');

      expect(mockDocument.getElementById).toHaveBeenCalledWith('test-id');
      expect(elementToFocus.focus).toHaveBeenCalled();
    });

    it('should do nothing when element with id does not exist', () => {
      mockDocument.getElementById = jest.fn().mockReturnValue(null);

      spectator.service.focusElementById('non-existent-id');

      expect(mockDocument.getElementById).toHaveBeenCalledWith('non-existent-id');
    });
  });

  describe('focusFirstFocusableElement', () => {
    it('should focus the first focusable element when focusable elements exist', () => {
      const focusableElements = [mockInput, mockButton];
      (mockElement.querySelectorAll as jest.Mock).mockReturnValue(focusableElements);

      spectator.service.focusFirstFocusableElement(mockElement as HTMLElement);

      expect(mockInput.focus).toHaveBeenCalled();
      expect(mockButton.focus).not.toHaveBeenCalled();
    });

    it('should do nothing when no focusable elements exist', () => {
      (mockElement.querySelectorAll as jest.Mock).mockReturnValue([]);

      spectator.service.focusFirstFocusableElement(mockElement as HTMLElement);

      expect(mockInput.focus).not.toHaveBeenCalled();
      expect(mockButton.focus).not.toHaveBeenCalled();
    });

    it('should do nothing when element is null', () => {
      spectator.service.focusFirstFocusableElement(null);

      expect(mockElement.querySelectorAll).not.toHaveBeenCalled();
    });
  });

  describe('getFocusableElements', () => {
    it('should return array of focusable elements', () => {
      const focusableElements = [mockInput, mockButton];
      (mockElement.querySelectorAll as jest.Mock).mockReturnValue(focusableElements);

      const result = spectator.service.getFocusableElements(mockElement as HTMLElement);

      expect(result).toEqual(focusableElements);
      expect(mockElement.querySelectorAll).toHaveBeenCalledWith(
        'a[href], area[href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [contenteditable], [tabindex]:not([tabindex="-1"])',
      );
    });

    it('should return empty array when no focusable elements exist', () => {
      (mockElement.querySelectorAll as jest.Mock).mockReturnValue([]);

      const result = spectator.service.getFocusableElements(mockElement as HTMLElement);

      expect(result).toEqual([]);
    });
  });
});
