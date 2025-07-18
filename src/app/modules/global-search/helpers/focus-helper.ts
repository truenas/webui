export function moveToNextFocusableElement(document: Document): void {
  const container = document.querySelector('.search-box-wrapper');

  if (!container) {
    return;
  }

  const focusableElements = Array.from(
    container.querySelectorAll('a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'),
  ).filter(
    (element: HTMLElement) => !(element as HTMLButtonElement).disabled && element.tabIndex >= 0,
  );

  const sortedElements = focusableElements.toSorted((a: HTMLElement, b: HTMLElement) => a.tabIndex - b.tabIndex);
  const currentIndex = sortedElements.indexOf(document.activeElement as HTMLElement);
  const nextIndex = (currentIndex + 1) % sortedElements.length;

  (sortedElements[nextIndex] as HTMLElement)?.focus();
}

export function moveToPreviousFocusableElement(document: Document): void {
  const container = document.querySelector('.search-box-wrapper');

  if (!container) {
    return;
  }

  const focusableElements = Array.from(
    container.querySelectorAll('a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'),
  ).filter(
    (element: HTMLElement) => !(element as HTMLButtonElement).disabled && element.tabIndex >= 0,
  );

  const sortedElements = focusableElements.toSorted((a: HTMLElement, b: HTMLElement) => a.tabIndex - b.tabIndex);
  const currentIndex = sortedElements.indexOf(document.activeElement as HTMLElement);
  const previousIndex = (currentIndex - 1 + sortedElements.length) % sortedElements.length;

  (sortedElements[previousIndex] as HTMLElement)?.focus();
}
