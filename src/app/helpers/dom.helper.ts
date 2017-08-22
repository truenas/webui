export function removeClass(el, className) {
  if (!el || el.length === 0)
    return;
  if (!el.length) {
    el.classList.remove(className);
  } else {
    for (var i = 0; i < el.length; i++) {
      el[i].classList.remove(className)
    }
  }
}
export function addClass(el, className) {
  if (!el)
    return;
  if (!el.length) {
    el.classList.add(className);
  } else {
    for (var i = 0; i < el.length; i++) {
      el[i].classList.add(className);
    }
  }
}
export function findClosest(el, className) {
  if (!el)
    return;
  while (el) {
    var parent = el.parentElement;
    if (parent && hasClass(parent, className)) {
      return parent;
    }
    el = parent;
  }
}
export function hasClass(el, className) {
  if (!el)
    return;
  return (` ${el.className} `).replace(/[\n\t]/g, ' ').indexOf(` ${className} `) > -1;
}
export function toggleClass(el, className) {
  if (!el)
    return;
  if (hasClass(el, className)) {
    removeClass(el, className);
  } else {
    addClass(el, className);
  }
}
export function changeTheme(themes: any[], themeName: string) {
  themes.forEach((theme) => {
    removeClass(document.body, theme.name);
  });
  addClass(document.body, themeName);
};
export function ieChatjsFix() {
  if(window.hasOwnProperty('MSInputMethodContext') || document.hasOwnProperty('documentMode')) {
    document.body.style.width = '99.9%';
    setTimeout(() => {
      document.body.style.width = '100%';
    })
  }
}