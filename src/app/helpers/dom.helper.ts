export function removeClass(el: HTMLElement | HTMLCollectionOf<HTMLElement>, className: string): void {
  if (!el || (el as HTMLCollectionOf<HTMLElement>).length === 0) return;
  if (!('length' in el)) {
    el.classList.remove(className);
  } else {
    for (let i = 0; i < el.length; i++) {
      el[i].classList.remove(className);
    }
  }
}

export function addClass(el: HTMLElement | HTMLCollectionOf<HTMLElement>, className: string): void {
  if (!el) return;
  if (!('length' in el)) {
    el.classList.add(className);
  } else {
    for (let i = 0; i < el.length; i++) {
      el[i].classList.add(className);
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
  return (` ${el.className} `).replace(/[\n\t]/g, ' ').indexOf(` ${className} `) > -1;
}

export function toggleClass(el: HTMLElement | HTMLCollectionOf<HTMLElement>, className: string): void {
  if (!el) return;
  if (hasClass((el as HTMLElement), className)) {
    removeClass(el, className);
  } else {
    addClass(el, className);
  }
}

export function changeTheme(): void {
  // Remove default
  /* removeClass(document.body, 'ix-blue');

  themes.forEach((theme) => {
    removeClass(document.body, theme.name);
    //removeClass(document.body, 'native');
  });
  addClass(document.body, themeName); */
  addClass(document.body, 'ix-blue');
}

export function ieChatjsFix(): void {
  if (window.hasOwnProperty('MSInputMethodContext') || document.hasOwnProperty('documentMode')) {
    document.body.style.width = '99.9%';
    setTimeout(() => {
      document.body.style.width = '100%';
    });
  }
}
