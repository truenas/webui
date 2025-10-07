import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig, MatSnackBarRef } from '@angular/material/snack-bar';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { SnackbarComponent } from 'app/modules/snackbar/components/snackbar/snackbar.component';
import { TranslatedString } from 'app/modules/translate/translate.helper';

/**
 * If you need more options for your custom case,
 * use SnackbarComponent or even MatSnackBar directly.
 */
@Injectable({
  providedIn: 'root',
})
export class SnackbarService {
  private matSnackBar = inject(MatSnackBar);

  success(message: TranslatedString): MatSnackBarRef<SnackbarComponent> {
    const config: MatSnackBarConfig = {
      announcementMessage: message,
      politeness: 'assertive',
      panelClass: 'ix-snackbar-high-priority',
      data: {
        message,
        icon: iconMarker('mdi-check'),
        iconCssColor: 'var(--green)',
      },
    };

    return this.matSnackBar.openFromComponent(SnackbarComponent, config);
  }
}
