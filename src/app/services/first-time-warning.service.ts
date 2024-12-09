import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { helptextSystemAdvanced } from 'app/helptext/system/advanced';
import { ConfirmOptions } from 'app/interfaces/dialog.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';

@Injectable({
  providedIn: 'root',
})
export class FirstTimeWarningService {
  shownWarnings = new Set<string>();
  shownConfirmations = new Set<string>();

  constructor(
    private dialogService: DialogService,
  ) {}

  showFirstTimeWarningIfNeeded(title?: string, message?: string): Observable<true> {
    const effectiveTitle = title || helptextSystemAdvanced.first_time.title;
    const effectiveMessage = message || helptextSystemAdvanced.first_time.message;

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

  showFirstTimeConfirmationIfNeeded(options: ConfirmOptions): Observable<boolean> {
    const { title, message } = options;
    const confirmationKey = `${title}::${message}`;

    if (this.shownConfirmations.has(confirmationKey)) {
      return of(true);
    }

    return this.dialogService.confirm({
      title,
      message,
    }).pipe(
      tap((confirmed) => {
        if (confirmed) {
          this.shownConfirmations.add(confirmationKey);
        }
      }),
    );
  }
}
