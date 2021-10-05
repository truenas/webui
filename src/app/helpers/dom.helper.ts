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

export function findClosest(el: HTMLElement, className: string): HTMLElement {
  if (!el) return;
  while (el) {
    const parent = el.parentElement;
    if (parent && hasClass(parent, className)) {
      return parent;
    }
    el = parent;
  }
}

export function hasClass(el: HTMLElement, className: string): boolean {
  if (!el) return;
  return (` ${el.className} `).replace(/[\n\t]/g, ' ').includes(` ${className} `);
}

export function toggleClass(el: HTMLElement | HTMLCollectionOf<HTMLElement>, className: string): void {
  if (!el) return;
  if (hasClass((el as HTMLElement), className)) {
    removeClass(el, className);
  } else {
    addClass(el, className);
  }
}
