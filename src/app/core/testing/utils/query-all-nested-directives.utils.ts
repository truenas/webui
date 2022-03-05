import { DebugElement, Type } from '@angular/core';
import { By } from '@angular/platform-browser';

export function queryAllNestedDirectives<T>(
  debugElement: DebugElement,
  parentSelector: string | HTMLElement,
  directive: Type<T>,
): T[] {
  let parentDebugElement: DebugElement;
  if (typeof parentSelector === 'string') {
    parentDebugElement = debugElement.query(By.css(parentSelector));
  } else {
    parentDebugElement = debugElement.query((element) => element.nativeElement === parentSelector);
  }

  const elements = parentDebugElement.queryAll(By.directive(directive));
  return elements.map((element) => element.injector.get(directive));
}
