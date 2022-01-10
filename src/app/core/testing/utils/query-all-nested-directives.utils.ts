import { DebugElement, Type } from '@angular/core';
import { By } from '@angular/platform-browser';

export function queryAllNestedDirectives<T>(
  debugElement: DebugElement,
  parentSelector: string,
  directive: Type<T>,
): T[] {
  const elements = debugElement.query(By.css(parentSelector)).queryAll(By.directive(directive));
  return elements.map((element) => element.injector.get(directive));
}
