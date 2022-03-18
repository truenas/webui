export function removeClass(el: HTMLElement | HTMLCollectionOf<HTMLElement>, className: string): void {
  if (!el || (el as HTMLCollectionOf<HTMLElement>).length === 0) return;
  if (!('length' in el)) {
    el.classList.remove(className);
  } else {
    for (const element of el) {
      element.classList.remove(className);
    }
  }
}

export function addClass(el: HTMLElement | HTMLCollectionOf<HTMLElement>, className: string): void {
  if (!el) return;
  if (!('length' in el)) {
    el.classList.add(className);
  } else {
    for (const element of el) {
      element.classList.add(className);
    }
  }
}
