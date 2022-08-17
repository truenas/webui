import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  ErrorHandler, Inject, Injectable, Optional,
} from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { ixSvgIcons } from 'app/modules/ix-icon/ix-icon.constants';

@Injectable({ providedIn: 'root' })
export class IxIconRegistry extends MatIconRegistry {
  constructor(
    @Optional() private httpClient: HttpClient,
    private sanitizer: DomSanitizer,
    @Optional() @Inject(DOCUMENT) document: Document,
    private readonly errorHandler: ErrorHandler,
  ) {
    super(httpClient, sanitizer, document, errorHandler);

    for (const [name, path] of Object.entries(ixSvgIcons)) {
      this.addSvgIconInNamespace('ix', name, this.sanitizer.bypassSecurityTrustResourceUrl(path));
    }
  }
}
