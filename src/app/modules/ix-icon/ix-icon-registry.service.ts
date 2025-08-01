import { HttpClient } from '@angular/common/http';
import { ErrorHandler, Injectable, DOCUMENT, inject } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import iconConfig from 'app/../assets/icons/sprite-config.json';

@Injectable({ providedIn: 'root' })
export class IxIconRegistry extends MatIconRegistry {
  constructor() {
    const httpClient = inject(HttpClient);
    const sanitizer = inject(DomSanitizer);
    const document = inject<Document>(DOCUMENT, { optional: true });
    const errorHandler = inject(ErrorHandler);

    super(httpClient, sanitizer, document, errorHandler);

    // eslint-disable-next-line sonarjs/no-angular-bypass-sanitization
    this.addSvgIconSet(sanitizer.bypassSecurityTrustResourceUrl(iconConfig.iconUrl));
  }
}
