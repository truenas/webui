import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { map, Observable, of } from 'rxjs';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';

@Injectable({ providedIn: 'root' })
export class UnsavedChangesService {
  private dialogService = inject(DialogService);
  private translate = inject(TranslateService);
  private authService = inject(AuthService);


  showConfirmDialog(): Observable<boolean> {
    if (!this.authService.hasAuthToken) {
      return of(true);
    }

    return this.dialogService.confirm({
      title: this.translate.instant('Unsaved Changes'),
      message: this.translate.instant('You have unsaved changes. Are you sure you want to close?'),
      cancelText: this.translate.instant('No'),
      buttonText: this.translate.instant('Yes'),
      buttonColor: 'warn',
      hideCheckbox: true,
    }).pipe(
      map((result) => Boolean(result)),
    );
  }
}
