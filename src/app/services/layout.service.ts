import { Inject, Injectable, TemplateRef } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { WINDOW } from 'app/helpers/window.helper';

@Injectable({
  providedIn: 'root',
})
export class LayoutService {
  /**
   * Prefer `ixPageHeader` directive.
   */
  readonly pageHeaderUpdater$ = new BehaviorSubject<TemplateRef<unknown>>(null);

  constructor(
    @Inject(WINDOW) private window: Window,
  ) {}

  getContentContainer(): HTMLElement {
    return this.window.document.querySelector('.rightside-content-hold');
  }
}
