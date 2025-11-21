import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { WINDOW } from 'app/helpers/window.helper';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';

@Injectable({
  providedIn: 'root',
})
export class WebShareService {
  private window = inject(WINDOW);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);

  /**
   * Port 755 is the standard WebShare service port defined by the backend.
   * This must match the port configured in the WebShare service and cannot be changed from the UI.
   */
  private readonly webSharePort = 755;

  /**
   * Opens a WebShare in a new browser window/tab.
   * @param shareName - Optional name of the specific share to open. If omitted, opens the root WebShare listing.
   */
  openWebShare(shareName?: string): void {
    const protocol = this.window.location.protocol;
    const hostname = this.window.location.hostname;
    const path = shareName ? `/webshare/${shareName}` : '/webshare/';
    const webShareUrl = `${protocol}//${hostname}:${this.webSharePort}${path}`;
    const newWindow = this.window.open(webShareUrl, '_blank');

    if (!newWindow) {
      this.snackbar.error(
        this.translate.instant('Unable to open WebShare. Please check your browser\'s popup blocker settings.'),
      );
    }
  }
}
