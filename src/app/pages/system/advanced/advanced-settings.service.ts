import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { tap } from 'rxjs/operators';
import { helptextSystemAdvanced } from 'app/helptext/system/advanced';
import { DialogService } from 'app/services/dialog.service';

@Injectable({
  providedIn: 'root',
})
export class AdvancedSettingsService {
  private isFirstTime = true;

  constructor(
    private dialogService: DialogService,
  ) {}

  async showFirstTimeWarningIfNeeded(): Promise<unknown> {
    if (!this.isFirstTime) {
      return Promise.resolve();
    }

    return lastValueFrom(
      this.dialogService
        .warn(helptextSystemAdvanced.first_time.title, helptextSystemAdvanced.first_time.message)
        .pipe(tap(() => this.isFirstTime = false)),
    );
  }
}
