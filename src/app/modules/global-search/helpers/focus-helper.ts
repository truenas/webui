import { focusableSelectors } from 'app/services/focus.service';

const searchBoxFocusableSelector = focusableSelectors.join(', ');

export function getFocusableSearchBoxElements(document: Document): HTMLElement[] {
  const container = document.querySelector('.search-box-wrapper');
  if (!container) return [];

  // The selectors in `focusableSelectors` already exclude disabled form
  // controls via `:not([disabled])`, so a runtime `:disabled` check would be
  // redundant — only `tabIndex >= 0` needs to be re-validated here (a
  // matched element can still be `tabindex="-1"` and that's not focusable).
  return Array.from(container.querySelectorAll<HTMLElement>(searchBoxFocusableSelector))
    .filter((element) => element.tabIndex >= 0)
    .toSorted((a, b) => a.tabIndex - b.tabIndex);
}

export function moveToNextFocusableElement(document: Document): void {
  const sortedElements = getFocusableSearchBoxElements(document);
  if (!sortedElements.length) return;

  const currentIndex = sortedElements.indexOf(document.activeElement as HTMLElement);
  const nextIndex = (currentIndex + 1) % sortedElements.length;
  sortedElements[nextIndex]?.focus();
}

export function moveToPreviousFocusableElement(document: Document): void {
  const sortedElements = getFocusableSearchBoxElements(document);
  if (!sortedElements.length) return;

  const currentIndex = sortedElements.indexOf(document.activeElement as HTMLElement);
  const previousIndex = (currentIndex - 1 + sortedElements.length) % sortedElements.length;
  sortedElements[previousIndex]?.focus();
}
