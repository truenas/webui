import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { helptextSystemAdvanced } from 'app/helptext/system/advanced';
import { DialogService } from 'app/modules/dialog/dialog.service';

@Injectable({
  providedIn: 'root',
})
export class FirstTimeWarningService {
  private dialogService = inject(DialogService);

  shownWarnings = new Set<string>();

  showFirstTimeWarningIfNeeded(title?: string, message?: string): Observable<true> {
    const effectiveTitle = title || helptextSystemAdvanced.firstTime.title;
    const effectiveMessage = message || helptextSystemAdvanced.firstTime.message;

    const warningKey = `${effectiveTitle}::${effectiveMessage}`;

    if (this.shownWarnings.has(warningKey)) {
      return of(true);
    }

    return this.dialogService.warn(
      effectiveTitle,
      effectiveMessage,
    ).pipe(
      tap(() => this.shownWarnings.add(warningKey)),
      map(() => true),
    );
  }
}
