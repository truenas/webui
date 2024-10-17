import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  ErrorHandler, Inject, Injectable, Optional,
} from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import iconConfig from 'app/../assets/icons/sprite-config.json';

@Injectable({ providedIn: 'root' })
export class IxIconRegistry extends MatIconRegistry {
  constructor(
    @Optional() httpClient: HttpClient,
    sanitizer: DomSanitizer,
    @Optional() @Inject(DOCUMENT) document: Document,
    errorHandler: ErrorHandler,
  ) {
    super(httpClient, sanitizer, document, errorHandler);

    // eslint-disable-next-line sonarjs/no-angular-bypass-sanitization
    this.addSvgIconSet(sanitizer.bypassSecurityTrustResourceUrl(iconConfig.iconUrl));
  }
}
