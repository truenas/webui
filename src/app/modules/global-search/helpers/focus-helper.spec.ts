import { moveToNextFocusableElement, moveToPreviousFocusableElement } from './focus-helper';

interface FocusableSpec {
  tag: 'button' | 'input';
  disabled?: boolean;
  tabIndex?: number;
}

describe('Focus Helper', () => {
  let container: HTMLDivElement;
  let elements: HTMLElement[];

  function setup(specs: FocusableSpec[]): HTMLElement[] {
    container = document.createElement('div');
    container.className = 'search-box-wrapper';
    document.body.appendChild(container);

    return specs.map((spec) => {
      const element = document.createElement(spec.tag);
      if (spec.disabled) element.setAttribute('disabled', '');
      if (spec.tabIndex !== undefined) element.tabIndex = spec.tabIndex;
      container.appendChild(element);
      return element;
    });
  }

  function focusActive(element: HTMLElement): void {
    element.focus();
  }

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('moveToNextFocusableElement', () => {
    it('focuses the next element in document order', () => {
      elements = setup([
        { tag: 'button' },
        { tag: 'button' },
        { tag: 'button' },
      ]);
      focusActive(elements[0]);

      moveToNextFocusableElement(document);

      expect(document.activeElement).toBe(elements[1]);
    });

    it('wraps around to the first element when at the end', () => {
      elements = setup([
        { tag: 'button' },
        { tag: 'button' },
        { tag: 'button' },
      ]);
      focusActive(elements[2]);

      moveToNextFocusableElement(document);

      expect(document.activeElement).toBe(elements[0]);
    });

    it('does nothing when the container is missing', () => {
      expect(() => moveToNextFocusableElement(document)).not.toThrow();
    });

    it('skips disabled buttons', () => {
      elements = setup([
        { tag: 'button' },
        { tag: 'button', disabled: true },
        { tag: 'button' },
      ]);
      focusActive(elements[0]);

      moveToNextFocusableElement(document);

      expect(document.activeElement).toBe(elements[2]);
    });

    it('skips elements with tabindex="-1"', () => {
      elements = setup([
        { tag: 'button' },
        { tag: 'button', tabIndex: -1 },
        { tag: 'button' },
      ]);
      focusActive(elements[0]);

      moveToNextFocusableElement(document);

      expect(document.activeElement).toBe(elements[2]);
    });

    it('orders by tabIndex when explicit tab indices are set', () => {
      elements = setup([
        { tag: 'button', tabIndex: 2 },
        { tag: 'button', tabIndex: 1 },
        { tag: 'button', tabIndex: 3 },
      ]);
      focusActive(elements[1]); // tabIndex 1

      moveToNextFocusableElement(document);

      expect(document.activeElement).toBe(elements[0]); // tabIndex 2
    });
  });

  describe('moveToPreviousFocusableElement', () => {
    it('focuses the previous element in document order', () => {
      elements = setup([
        { tag: 'button' },
        { tag: 'button' },
        { tag: 'button' },
      ]);
      focusActive(elements[1]);

      moveToPreviousFocusableElement(document);

      expect(document.activeElement).toBe(elements[0]);
    });

    it('wraps around to the last element when at the beginning', () => {
      elements = setup([
        { tag: 'button' },
        { tag: 'button' },
        { tag: 'button' },
      ]);
      focusActive(elements[0]);

      moveToPreviousFocusableElement(document);

      expect(document.activeElement).toBe(elements[2]);
    });

    it('does nothing when the container is missing', () => {
      expect(() => moveToPreviousFocusableElement(document)).not.toThrow();
    });

    it('skips disabled buttons', () => {
      elements = setup([
        { tag: 'button' },
        { tag: 'button', disabled: true },
        { tag: 'button' },
      ]);
      focusActive(elements[2]);

      moveToPreviousFocusableElement(document);

      expect(document.activeElement).toBe(elements[0]);
    });

    it('skips elements with tabindex="-1"', () => {
      elements = setup([
        { tag: 'button' },
        { tag: 'button', tabIndex: -1 },
        { tag: 'button' },
      ]);
      focusActive(elements[2]);

      moveToPreviousFocusableElement(document);

      expect(document.activeElement).toBe(elements[0]);
    });

    it('orders by tabIndex when explicit tab indices are set', () => {
      elements = setup([
        { tag: 'button', tabIndex: 2 },
        { tag: 'button', tabIndex: 1 },
        { tag: 'button', tabIndex: 3 },
      ]);
      focusActive(elements[2]); // tabIndex 3

      moveToPreviousFocusableElement(document);

      expect(document.activeElement).toBe(elements[0]); // tabIndex 2
    });
  });
});
