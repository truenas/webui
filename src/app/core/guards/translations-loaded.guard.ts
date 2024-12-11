import { Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable, of } from 'rxjs';
import {
  catchError, map, timeout,
} from 'rxjs/operators';
import { LanguageService } from 'app/services/language.service';
import { WebSocketHandlerService } from 'app/services/websocket/websocket-handler.service';

/**
 * Ensures that translations have been loaded.
 */
@UntilDestroy()
@Injectable({ providedIn: 'root' })
export class TranslationsLoadedGuard {
  // Bail on translations if it takes too much time to load.
  private readonly maxLanguageLoadingTime = 10 * 1000;
  isConnected = false;
  constructor(
    private languageService: LanguageService,
    private wsHandler: WebSocketHandlerService,
  ) {
    this.wsHandler.isConnected$.pipe(untilDestroyed(this)).subscribe((isConnected) => {
      this.isConnected = isConnected;
    });
  }

  canActivate(): Observable<boolean> {
    let waitForTranslations$: Observable<boolean>;

    if (!this.isConnected) {
      // Cannot load translations for an unauthorized user.
      waitForTranslations$ = this.languageService.setLanguageFromBrowser();
    } else {
      waitForTranslations$ = this.languageService.setLanguageFromMiddleware();
    }

    return waitForTranslations$.pipe(
      timeout(this.maxLanguageLoadingTime),
      map(() => true),
      catchError((error: unknown) => {
        console.error('Error loading translations: ', error);
        return of(true);
      }),
    );
  }
}
