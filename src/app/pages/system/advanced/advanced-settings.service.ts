import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { helptextSystemAdvanced } from 'app/helptext/system/advanced';
import { DialogService } from 'app/modules/dialog/dialog.service';

@Injectable({
  providedIn: 'root',
})
export class AdvancedSettingsService {
  private isFirstTime = true;

  constructor(
    private dialogService: DialogService,
  ) {}

  showFirstTimeWarningIfNeeded(): Observable<true> {
    if (!this.isFirstTime) {
      return of(true);
    }

    return this.dialogService.warn(
      helptextSystemAdvanced.first_time.title,
      helptextSystemAdvanced.first_time.message,
    ).pipe(
      tap(() => this.isFirstTime = false),
      map(() => true),
    );
  }
}
