import { Injectable } from '@angular/core';
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
  constructor(
    private matSnackBar: MatSnackBar,
  ) {}

  success(message: TranslatedString): MatSnackBarRef<SnackbarComponent> {
    const config: MatSnackBarConfig = {
      announcementMessage: message,
      politeness: 'assertive',
      data: {
        message,
        icon: iconMarker('mdi-check'),
        iconCssColor: 'var(--green)',
      },
    };

    const ref = this.matSnackBar.openFromComponent(SnackbarComponent, config);

    this.forceOverlayIndex(ref, 3000);

    return ref;
  }

  // This is a workaround to force the snackbar to be on top of other overlays.
  private forceOverlayIndex(ref: MatSnackBarRef<SnackbarComponent>, zIndex: number): void {
    const containerEl = ref.containerInstance._elementRef.nativeElement as HTMLElement;
    const overlayPane = containerEl.closest('.cdk-global-overlay-wrapper') as HTMLElement | null;

    if (overlayPane) {
      overlayPane.style.zIndex = String(zIndex);
    }
  }
}
