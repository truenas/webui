export function moveToNextFocusableElement(): void {
  const container = document.querySelector('.search-box-wrapper');

  const focusableElements = Array.from(
    container.querySelectorAll('a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'),
  ).filter(
    (element: HTMLElement) => !(element as HTMLButtonElement).disabled && element.tabIndex >= 0,
  );

  const sortedFocusableElements = focusableElements.sort((a: HTMLElement, b: HTMLElement) => a.tabIndex - b.tabIndex);
  const currentIndex = sortedFocusableElements.indexOf(document.activeElement as HTMLElement);
  const nextIndex = (currentIndex + 1) % sortedFocusableElements.length;

  (sortedFocusableElements[nextIndex] as HTMLElement)?.focus();
}

export function moveToPreviousFocusableElement(): void {
  const container = document.querySelector('.search-box-wrapper');

  const focusableElements = Array.from(
    container.querySelectorAll('a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'),
  ).filter(
    (element: HTMLElement) => !(element as HTMLButtonElement).disabled && element.tabIndex >= 0,
  );

  const sortedFocusableElements = focusableElements.sort((a: HTMLElement, b: HTMLElement) => a.tabIndex - b.tabIndex);
  const currentIndex = sortedFocusableElements.indexOf(document.activeElement as HTMLElement);
  const previousIndex = (currentIndex - 1 + sortedFocusableElements.length) % sortedFocusableElements.length;

  (sortedFocusableElements[previousIndex] as HTMLElement)?.focus();
}
