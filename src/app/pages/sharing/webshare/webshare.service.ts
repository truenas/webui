import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { switchMap, take, map } from 'rxjs/operators';
import { WINDOW } from 'app/helpers/window.helper';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';
import { LicenseService } from 'app/services/license.service';
import { WebShareSharesFormComponent, WebShareFormData } from './webshare-shares-form/webshare-shares-form.component';

@Injectable({
  providedIn: 'root',
})
export class WebShareService {
  private window = inject(WINDOW);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);
  private licenseService = inject(LicenseService);
  private slideIn = inject(SlideIn);
  private truenasConnectService = inject(TruenasConnectService);

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

  /**
   * Opens the WebShare form to add or edit a share.
   * Checks for TrueNAS Connect availability before opening the form.
   * If TrueNAS Connect is not configured, opens the TrueNAS Connect status dialog instead.
   *
   * @param data - Form data for creating or editing a WebShare
   * @returns Observable that emits true if the form was submitted successfully, false otherwise
   */
  openWebShareForm(data: WebShareFormData): Observable<boolean> {
    return this.licenseService.hasTruenasConnect$.pipe(
      take(1),
      switchMap((hasAccess) => {
        if (!hasAccess) {
          this.truenasConnectService.openStatusModal();
          return of(false);
        }

        return this.slideIn.open(WebShareSharesFormComponent, { data }).pipe(
          map((result) => !!result?.response),
        );
      }),
    );
  }
}
