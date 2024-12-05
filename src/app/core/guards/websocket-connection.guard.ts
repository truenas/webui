import { Inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { WINDOW } from 'app/helpers/window.helper';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { WebSocketHandlerService } from 'app/services/websocket/websocket-handler.service';

@UntilDestroy()
@Injectable({ providedIn: 'root' })
export class WebSocketConnectionGuard {
  isConnected = false;
  constructor(
    private wsManager: WebSocketHandlerService,
    protected router: Router,
    private matDialog: MatDialog,
    private dialogService: DialogService,
    private translate: TranslateService,
    @Inject(WINDOW) private window: Window,
  ) {
    this.wsManager.isClosed$.pipe(untilDestroyed(this)).subscribe((isClosed) => {
      if (isClosed) {
        this.resetUi();
        // TODO: Test why manually changing close status is needed
        // Test a shutdown function to see how UI acts when this isn't done
        // this.wsManager.isClosed$ = false;
      }
    });

    this.wsManager.isAccessRestricted$.pipe(untilDestroyed(this)).subscribe((isRestricted) => {
      if (isRestricted) {
        this.showAccessRestrictedDialog();
        this.wsManager.isAccessRestricted$ = false;
      }
    });
  }

  private resetUi(): void {
    this.closeAllDialogs();
    if (!this.wsManager.isSystemShuttingDown) {
      // manually preserve query params
      const params = new URLSearchParams(this.window.location.search);
      this.router.navigate(['/signin'], { queryParams: Object.fromEntries(params) });
    }
  }

  private closeAllDialogs(): void {
    for (const openDialog of this.matDialog.openDialogs) {
      openDialog.close();
    }
  }

  private showAccessRestrictedDialog(): void {
    this.dialogService.fullScreenDialog({
      title: this.translate.instant('Access restricted'),
      message: this.translate.instant('Access from your IP is restricted'),
    }).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.wsManager.reconnect();
      },
    });
  }

  canActivate(): boolean {
    return true;
  }
}
