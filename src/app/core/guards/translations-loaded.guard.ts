import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot } from '@angular/router';
import { LanguageService } from 'app/services/language.service';
import { of } from 'rxjs';
import { Observable } from 'rxjs/Observable';
import { catchError, defaultIfEmpty, timeout } from 'rxjs/operators';
import { WebSocketService } from 'app/services/ws.service';

/**
 * Ensures that translations have been loaded.
 */
@Injectable({ providedIn: 'root' })
export class TranslationsLoadedGuard implements CanActivate {
  // Bail on translations if it takes too much time to load.
  private readonly maxLanguageLoadingTime = 20 * 1000;

  constructor(
    private languageService: LanguageService,
    private ws: WebSocketService,
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    let waitForTranslations: Observable<void>;

    if (!this.ws.connected) {
      // Cannot load translations for an unauthorized user.
      waitForTranslations = this.languageService.setLanguageFromBrowser();
    } else {
      waitForTranslations = this.languageService.setLanguageFromMiddleware();
    }

    return waitForTranslations.pipe(
      timeout(this.maxLanguageLoadingTime),
      defaultIfEmpty<boolean>(true),
      catchError((error) => {
        console.error('Error loading translations: ', error);
        return of(true);
      }),
    );
  }
}
