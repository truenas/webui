import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
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
      data: {
        message,
        icon: 'check',
        iconCssColor: 'var(--green)',
      },
    });
  }
}
