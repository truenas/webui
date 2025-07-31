import { Injectable, inject } from '@angular/core';
import {
  AbstractControl, ValidationErrors,
} from '@angular/forms';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  Observable, catchError, debounceTime, distinctUntilChanged, of, switchMap, take,
} from 'rxjs';
import { extractApiErrorDetails } from 'app/helpers/api.helper';
import { ApiService } from 'app/modules/websocket/api.service';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class SmbValidationService {
  private api = inject(ApiService);
  private translate = inject(TranslateService);

  private nameExistsError = T('Share with this name already exists');
  private invalidCharactersError = T('Share name contains the following invalid characters');

  validate = (originalName?: string): (control: AbstractControl<string>) => Observable<ValidationErrors | null> => {
    return (control: AbstractControl<string>): Observable<ValidationErrors | null> => {
      return control.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        take(1),
        switchMap((value: string) => {
          if (originalName === value) {
            return of(null);
          }

          return this.runPreCheck(value).pipe(
            switchMap((response) => this.handleError(response)),
            catchError((error: unknown) => this.handleError(error)),
          );
        }),
      );
    };
  };

  checkForSmbUsersWarning(): Observable<boolean> {
    return this.runPreCheck().pipe(
      switchMap((response) => this.handleSmbUsersError(response)),
      catchError((error: unknown) => this.handleSmbUsersError(error)),
      take(1),
    );
  }

  private isNoSmbUsersError(errorText: string): boolean {
    return errorText.toLowerCase().includes('sharing.smb.share_precheck:');
  }

  private runPreCheck(name = ' '): Observable<ValidationErrors | null> {
    return this.api.call('sharing.smb.share_precheck', [{ name }]);
  }

  private handleError(error: unknown): Observable<ValidationErrors | null> {
    if (error === null) {
      return of(null);
    }

    const apiError = extractApiErrorDetails(error);
    const errorText = this.extractError(apiError?.reason || '');

    if (!errorText.length) {
      return of(null);
    }

    return of({
      customValidator: {
        message: errorText,
      },
    });
  }

  private handleSmbUsersError(error: unknown): Observable<boolean> {
    const errorText = extractApiErrorDetails(error)?.reason || '';
    return of(this.isNoSmbUsersError(errorText));
  }

  private extractError(error: string): string {
    const errorText = error.replace('[EINVAL] sharing.smb.share_precheck: TrueNAS server must be joined to a directory service or have at least one local SMB user before creating an SMB share.', '');

    if (errorText.includes(this.nameExistsError)) {
      return this.translate.instant(this.nameExistsError);
    }

    if (errorText.includes(this.invalidCharactersError)) {
      return `${this.translate.instant(this.invalidCharactersError)}: ${errorText.split(this.invalidCharactersError)[1].trim()}`;
    }

    return errorText.trim();
  }
}
