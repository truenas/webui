import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  ErrorHandler, Inject, Injectable, Optional,
} from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

// TODO: Nuke.
@Injectable({ providedIn: 'root' })
export class IxIconRegistry extends MatIconRegistry {
  constructor(
    @Optional() private httpClient: HttpClient,
    private sanitizer: DomSanitizer,
    @Optional() @Inject(DOCUMENT) document: Document,
    private readonly errorHandler: ErrorHandler,
  ) {
    super(httpClient, sanitizer, document, errorHandler);

    this.addSvgIconSet(this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/sprite.svg'));
  }
}
