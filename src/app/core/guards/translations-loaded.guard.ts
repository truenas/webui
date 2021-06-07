import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { Observable, of } from 'rxjs';
import {
  catchError, map, timeout,
} from 'rxjs/operators';
import { LanguageService } from 'app/services/language.service';
import { WebSocketService } from 'app/services/ws.service';

/**
 * Ensures that translations have been loaded.
 */
@Injectable({ providedIn: 'root' })
export class TranslationsLoadedGuard implements CanActivate {
  // Bail on translations if it takes too much time to load.
  private readonly maxLanguageLoadingTime = 10 * 1000;

  constructor(
    private languageService: LanguageService,
    private ws: WebSocketService,
  ) {}

  canActivate(): Observable<boolean> {
    let waitForTranslations: Observable<boolean>;

    if (!this.ws.connected) {
      // Cannot load translations for an unauthorized user.
      waitForTranslations = this.languageService.setLanguageFromBrowser();
    } else {
      waitForTranslations = this.languageService.setLanguageFromMiddleware();
    }

    return waitForTranslations.pipe(
      timeout(this.maxLanguageLoadingTime),
      map(() => true),
      catchError((error) => {
        console.error('Error loading translations: ', error);
        return of(true);
      }),
    );
  }
}
