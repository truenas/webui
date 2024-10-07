import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
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

  success(message: string): MatSnackBarRef<SnackbarComponent> {
    return this.matSnackBar.openFromComponent(SnackbarComponent, {
      announcementMessage: message,
      politeness: 'assertive',
      data: {
        message,
        icon: iconMarker('check'),
        iconCssColor: 'var(--green)',
      },
    });
  }
}
