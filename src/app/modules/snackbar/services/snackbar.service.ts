import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig, MatSnackBarRef } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { tnIconMarker } from '@truenas/ui-components';
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
      duration: options.duration ?? 4000,
      verticalPosition: options.verticalPosition ?? 'top',
      panelClass: options.panelClass || 'ix-snackbar-high-priority',
      data: {
        message: options.message,
        icon: options.icon ?? tnIconMarker('information', 'mdi'),
        iconCssColor: options.iconCssColor || 'var(--primary)',
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
      icon: tnIconMarker('check', 'mdi'),
      iconCssColor: 'var(--green)',
      politeness: 'assertive',
      verticalPosition: 'top',
    });
  }

  error(message: TranslatedString): MatSnackBarRef<SnackbarComponent> {
    return this.open({
      message,
      icon: tnIconMarker('alert-circle', 'mdi'),
      iconCssColor: 'var(--red)',
      politeness: 'assertive',
      button: {
        title: this.translate.instant('Close'),
      },
    });
  }
}
