import { Injectable } from '@angular/core';
import {
  AbstractControl, ValidationErrors,
} from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import {
  Observable, catchError, debounceTime, distinctUntilChanged, of, switchMap, take,
} from 'rxjs';
import { WebSocketService } from 'app/services/ws.service';

@Injectable({
  providedIn: 'root',
})
export class SmbValidationService {
  private noSmbUsersError = this.translate.instant('TrueNAS server must be joined to Active Directory or have at least one local SMB user before creating an SMB share');
  private nameExistsError = this.translate.instant('Share with this name already exists');
  private errorText: string;

  constructor(
    private ws: WebSocketService,
    private translate: TranslateService,
  ) { }

  validate = (originalName?: string) => {
    return (control: AbstractControl<string>): Observable<ValidationErrors | null> => {
      return control.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        take(1),
        switchMap((value: string) => {
          if (originalName === value) {
            return of(null);
          }

          return this.ws.call('sharing.smb.share_precheck', [{ name: value }]).pipe(
            catchError((error: { reason: string }) => {
              this.errorText = this.extractError(error.reason);

              return of({
                customValidator: {
                  message: this.errorText,
                },
                preCheckFailed: true,
              });
            }),
            switchMap((response) => {
              return response === null
                ? of(null)
                : of({
                  customValidator: {
                    message: this.errorText,
                  },
                  preCheckFailed: true,
                });
            }),
          );
        }),
      );
    };
  };

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
