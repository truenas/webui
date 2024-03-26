export function moveToNextFocusableElement(): void {
  const focusableElements = Array.from(
    document.querySelectorAll('a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'),
  ).filter(
    (element: HTMLElement) => !(element as HTMLButtonElement).disabled && element.tabIndex >= 0,
  );

  const currentIndex = focusableElements.indexOf(document.activeElement);
  const nextIndex = (currentIndex + 1) % focusableElements.length;

  (focusableElements[nextIndex] as HTMLElement)?.focus();
}

export function moveToPreviousFocusableElement(): void {
  const focusableElements = Array.from(
    document.querySelectorAll('a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'),
  ).filter(
    (element: HTMLElement) => !(element as HTMLButtonElement).disabled && element.tabIndex >= 0,
  );

  const currentIndex = focusableElements.indexOf(document.activeElement);
  const previousIndex = (currentIndex - 1 + focusableElements.length) % focusableElements.length;

  (focusableElements[previousIndex] as HTMLElement)?.focus();
}
