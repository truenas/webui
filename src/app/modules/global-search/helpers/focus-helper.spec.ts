import { moveToNextFocusableElement, moveToPreviousFocusableElement } from './focus-helper';

describe('Focus Helper', () => {
  let mockDocument: Document;
  let mockContainer: Partial<HTMLElement>;
  let mockElements: Partial<HTMLElement>[];

  beforeEach(() => {
    mockElements = [
      { disabled: false, tabIndex: 0, focus: jest.fn() } as Partial<HTMLElement>,
      { disabled: false, tabIndex: 1, focus: jest.fn() } as Partial<HTMLElement>,
      { disabled: false, tabIndex: 2, focus: jest.fn() } as Partial<HTMLElement>,
    ];

    mockContainer = {
      querySelectorAll: jest.fn().mockReturnValue(mockElements),
    };

    mockDocument = {
      querySelector: jest.fn().mockReturnValue(mockContainer),
    } as unknown as Document;

    Object.defineProperty(mockDocument, 'activeElement', {
      value: mockElements[0] as HTMLElement,
      writable: true,
      configurable: true,
    });
  });

  describe('moveToNextFocusableElement', () => {
    it('should focus next element in sequence', () => {
      Object.defineProperty(mockDocument, 'activeElement', {
        value: mockElements[0] as HTMLElement,
        writable: true,
        configurable: true,
      });

      moveToNextFocusableElement(mockDocument);

      expect(mockElements[1]?.focus).toHaveBeenCalled();
    });

    it('should wrap around to first element when at end', () => {
      Object.defineProperty(mockDocument, 'activeElement', {
        value: mockElements[2] as HTMLElement,
        writable: true,
        configurable: true,
      });

      moveToNextFocusableElement(mockDocument);

      expect(mockElements[0]?.focus).toHaveBeenCalled();
    });

    it('should handle case when container is not found', () => {
      mockDocument.querySelector = jest.fn().mockReturnValue(null);

      expect(() => moveToNextFocusableElement(mockDocument)).not.toThrow();
    });

    it('should filter out disabled elements', () => {
      mockElements[1] = { disabled: true, tabIndex: 1, focus: jest.fn() } as Partial<HTMLElement>;
      mockContainer.querySelectorAll = jest.fn().mockReturnValue(mockElements);
      Object.defineProperty(mockDocument, 'activeElement', {
        value: mockElements[0] as HTMLElement,
        writable: true,
        configurable: true,
      });

      moveToNextFocusableElement(mockDocument);

      expect(mockElements[2]?.focus).toHaveBeenCalled();
    });

    it('should filter out elements with negative tabIndex', () => {
      mockElements[1] = { disabled: false, tabIndex: -1, focus: jest.fn() } as Partial<HTMLElement>;
      mockContainer.querySelectorAll = jest.fn().mockReturnValue(mockElements);
      Object.defineProperty(mockDocument, 'activeElement', {
        value: mockElements[0] as HTMLElement,
        writable: true,
        configurable: true,
      });

      moveToNextFocusableElement(mockDocument);

      expect(mockElements[2]?.focus).toHaveBeenCalled();
    });

    it('should sort elements by tabIndex', () => {
      const unsortedElements = [
        { disabled: false, tabIndex: 2, focus: jest.fn() } as Partial<HTMLElement>,
        { disabled: false, tabIndex: 0, focus: jest.fn() } as Partial<HTMLElement>,
        { disabled: false, tabIndex: 1, focus: jest.fn() } as Partial<HTMLElement>,
      ];
      mockContainer.querySelectorAll = jest.fn().mockReturnValue(unsortedElements);
      Object.defineProperty(mockDocument, 'activeElement', {
        value: unsortedElements[1] as HTMLElement, // tabIndex: 0
        writable: true,
        configurable: true,
      });

      moveToNextFocusableElement(mockDocument);

      expect(unsortedElements[2]?.focus).toHaveBeenCalled(); // tabIndex: 1
    });
  });

  describe('moveToPreviousFocusableElement', () => {
    it('should focus previous element in sequence', () => {
      Object.defineProperty(mockDocument, 'activeElement', {
        value: mockElements[1] as HTMLElement,
        writable: true,
        configurable: true,
      });

      moveToPreviousFocusableElement(mockDocument);

      expect(mockElements[0]?.focus).toHaveBeenCalled();
    });

    it('should wrap around to last element when at beginning', () => {
      Object.defineProperty(mockDocument, 'activeElement', {
        value: mockElements[0] as HTMLElement,
        writable: true,
        configurable: true,
      });

      moveToPreviousFocusableElement(mockDocument);

      expect(mockElements[2]?.focus).toHaveBeenCalled();
    });

    it('should handle case when container is not found', () => {
      mockDocument.querySelector = jest.fn().mockReturnValue(null);

      expect(() => moveToPreviousFocusableElement(mockDocument)).not.toThrow();
    });

    it('should filter out disabled elements', () => {
      mockElements[1] = { disabled: true, tabIndex: 1, focus: jest.fn() } as Partial<HTMLElement>;
      mockContainer.querySelectorAll = jest.fn().mockReturnValue(mockElements);
      Object.defineProperty(mockDocument, 'activeElement', {
        value: mockElements[2] as HTMLElement,
        writable: true,
        configurable: true,
      });

      moveToPreviousFocusableElement(mockDocument);

      expect(mockElements[0]?.focus).toHaveBeenCalled();
    });

    it('should filter out elements with negative tabIndex', () => {
      mockElements[1] = { disabled: false, tabIndex: -1, focus: jest.fn() } as Partial<HTMLElement>;
      mockContainer.querySelectorAll = jest.fn().mockReturnValue(mockElements);
      Object.defineProperty(mockDocument, 'activeElement', {
        value: mockElements[2] as HTMLElement,
        writable: true,
        configurable: true,
      });

      moveToPreviousFocusableElement(mockDocument);

      expect(mockElements[0]?.focus).toHaveBeenCalled();
    });

    it('should sort elements by tabIndex', () => {
      const unsortedElements = [
        { disabled: false, tabIndex: 2, focus: jest.fn() } as Partial<HTMLElement>,
        { disabled: false, tabIndex: 0, focus: jest.fn() } as Partial<HTMLElement>,
        { disabled: false, tabIndex: 1, focus: jest.fn() } as Partial<HTMLElement>,
      ];
      mockContainer.querySelectorAll = jest.fn().mockReturnValue(unsortedElements);
      Object.defineProperty(mockDocument, 'activeElement', {
        value: unsortedElements[2] as HTMLElement, // tabIndex: 1
        writable: true,
        configurable: true,
      });

      moveToPreviousFocusableElement(mockDocument);

      expect(unsortedElements[1]?.focus).toHaveBeenCalled(); // tabIndex: 0
    });
  });
});
