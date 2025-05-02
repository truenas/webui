import { Inject, Injectable } from '@angular/core';
import createDOMPurify from 'dompurify';
import type { DOMPurify as DOMPurifyType } from 'dompurify';
import { WINDOW } from 'app/helpers/window.helper';

@Injectable({
  providedIn: 'root',
})
export class SanitizerService {
  private domPurify: DOMPurifyType;

  constructor(
    @Inject(WINDOW) private window: Window,
  ) {
    this.domPurify = createDOMPurify(this.window.window);
  }

  sanitize(dirtyHtml: string): string {
    return this.domPurify.sanitize(dirtyHtml, {
      ADD_ATTR: ['target'],
    });
  }
}
