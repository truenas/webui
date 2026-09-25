import { Location } from '@angular/common';
import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { isSigninUrl } from 'app/helpers/url.helper';
import { WINDOW } from 'app/helpers/window.helper';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ConnectionService } from 'app/modules/websocket/connection.service';

@Injectable({ providedIn: 'root' })
export class WebSocketConnectionGuard {
  private connection = inject(ConnectionService);
  protected router = inject(Router);
  private location = inject(Location);
  private dialogService = inject(DialogService);
  private translate = inject(TranslateService);
  private window = inject<Window>(WINDOW);
  private destroyRef = inject(DestroyRef);

  isConnected = false;
  constructor() {
    this.connection.isClosed$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((isClosed) => {
      if (isClosed) {
        this.resetUi();
      }
    });

    this.connection.isAccessRestricted$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((isRestricted) => {
      if (isRestricted) {
        this.showAccessRestrictedDialog();
        this.connection.acknowledgeAccessRestricted();
      }
    });
  }

  private resetUi(): void {
    this.dialogService.closeAllDialogs();
    if (!this.connection.isSystemShuttingDown) {
      // Store current URL before redirecting to signin so user can return after login
      // Use location.path() which returns the path without base href and includes query params
      const currentUrl = this.location.path();
      if (!isSigninUrl(currentUrl)) {
        this.window.sessionStorage.setItem('redirectUrl', currentUrl);
      }

      // manually preserve query params
      const params = new URLSearchParams(this.window.location.search);
      this.router.navigate(['/signin'], { queryParams: Object.fromEntries(params) });
    }
  }

  private showAccessRestrictedDialog(): void {
    this.dialogService.fullScreenDialog({
      title: this.translate.instant('Access restricted'),
      message: this.translate.instant('Access from your IP is restricted'),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.connection.reconnect();
      },
    });
  }

  canActivate(): boolean {
    return true;
  }
}
