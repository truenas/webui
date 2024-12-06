import { Injectable } from '@angular/core';
import {
  AbstractControl, ValidationErrors,
} from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  Observable, catchError, debounceTime, distinctUntilChanged, of, switchMap, take,
} from 'rxjs';
import { extractApiError } from 'app/helpers/api.helper';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ApiService } from 'app/services/websocket/api.service';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class SmbValidationService {
  private noSmbUsersError = this.translate.instant('TrueNAS server must be joined to Active Directory or have at least one local SMB user before creating an SMB share');
  private nameExistsError = this.translate.instant('Share with this name already exists');
  private wasNoSmbUsersWarningShown = false;

  constructor(
    private api: ApiService,
    private dialogService: DialogService,
    private translate: TranslateService,
  ) { }

  validate = (originalName?: string): (control: AbstractControl<string>) => Observable<ValidationErrors | null> => {
    this.wasNoSmbUsersWarningShown = false;
    return (control: AbstractControl<string>): Observable<ValidationErrors | null> => {
      return control.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        take(1),
        switchMap((value: string) => {
          if (originalName === value) {
            return of(null);
          }

          return this.api.call('sharing.smb.share_precheck', [{ name: value }]).pipe(
            switchMap((response) => this.handleError(response)),
            catchError((error: unknown) => this.handleError(error)),
          );
        }),
      );
    };
  };

  private handleError(error: unknown): Observable<ValidationErrors | null> {
    if (error === null) {
      return of(null);
    }

    const apiError = extractApiError(error);
    const errorText = this.extractError(apiError?.reason || '');

    if (errorText === this.noSmbUsersError) {
      this.showNoSmbUsersWarning();
      return of(null);
    }

    return of({
      customValidator: {
        message: errorText,
      },
      preCheckFailed: true,
    });
  }

  private showNoSmbUsersWarning(): void {
    if (this.wasNoSmbUsersWarningShown) {
      return;
    }
    this.wasNoSmbUsersWarningShown = true;
    this.dialogService
      .confirm({
        title: this.translate.instant('Warning'),
        message: this.noSmbUsersError,
        hideCheckbox: true,
        buttonText: this.translate.instant('Close'),
        hideCancel: true,
      })
      .pipe(untilDestroyed(this))
      .subscribe();
  }

  private extractError(error: string): string {
    if (error.includes(this.noSmbUsersError)) {
      return this.translate.instant(this.noSmbUsersError);
    }
    if (error.includes(this.nameExistsError)) {
      return this.translate.instant(this.nameExistsError);
    }
    return error;
  }
}
