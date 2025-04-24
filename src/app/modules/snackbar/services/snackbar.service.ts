import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { TranslatedString } from 'app/helpers/translate.helper';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { SnackbarComponent } from 'app/modules/snackbar/components/snackbar/snackbar.component';

/**
 * If you need more options for your custom case,
 * use SnackbarComponent or even MatSnackBar directly.
 */
@Injectable({
  providedIn: 'root',
})
export class SnackbarService {
  constructor(
    private matSnackBar: MatSnackBar,
  ) {}

  success(message: TranslatedString): MatSnackBarRef<SnackbarComponent> {
    return this.matSnackBar.openFromComponent(SnackbarComponent, {
      announcementMessage: message,
      politeness: 'assertive',
      data: {
        message,
        icon: iconMarker('mdi-check'),
        iconCssColor: 'var(--green)',
      },
    });
  }
}
