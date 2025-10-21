import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig, MatSnackBarRef } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { SnackbarOptions } from 'app/modules/snackbar/components/snackbar/snackbar-config.interface';
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
  private translate = inject(TranslateService);

  open(options: SnackbarOptions): MatSnackBarRef<SnackbarComponent> {
    const config: MatSnackBarConfig = {
      announcementMessage: options.message,
      politeness: options.politeness ?? 'polite',
      duration: options.duration ?? 5000,
      verticalPosition: options.verticalPosition ?? 'bottom',
      panelClass: options.panelClass,
      data: {
        message: options.message,
        icon: options.icon,
        iconCssColor: options.iconCssColor,
        button: options.button,
      },
    };

    return this.matSnackBar.openFromComponent(SnackbarComponent, config);
  }

  dismiss(): void {
    this.matSnackBar.dismiss();
  }

  success(message: TranslatedString): MatSnackBarRef<SnackbarComponent> {
    return this.open({
      message,
      icon: iconMarker('mdi-check'),
      iconCssColor: 'var(--green)',
      politeness: 'assertive',
      panelClass: 'ix-snackbar-high-priority',
      verticalPosition: 'top',
    });
  }

  error(message: TranslatedString): MatSnackBarRef<SnackbarComponent> {
    return this.open({
      message,
      icon: iconMarker('mdi-alert-circle'),
      iconCssColor: 'var(--red)',
      politeness: 'assertive',
      duration: 4000,
      button: {
        title: this.translate.instant('Close'),
      },
    });
  }
}
