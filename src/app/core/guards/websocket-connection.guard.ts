import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { DialogService } from 'app/services/dialog.service';
import { WebsocketConnectionService } from 'app/services/websocket-connection.service';

@UntilDestroy()
@Injectable({ providedIn: 'root' })
export class WebsocketConnectionGuard {
  isConnected = false;
  constructor(
    private wsManager: WebsocketConnectionService,
    protected router: Router,
    private dialog: MatDialog,
    private dialogService: DialogService,
    private translate: TranslateService,
  ) {
    this.wsManager.isClosed$.pipe(untilDestroyed(this)).subscribe((isClosed) => {
      if (isClosed) {
        this.resetUi();
        this.wsManager.isClosed$ = false;
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
    if (!this.wsManager.shutDownInProgress) {
      this.router.navigate(['/sessions/signin']);
    }
  }

  private closeAllDialogs(): void {
    for (const openDialog of this.dialog.openDialogs) {
      openDialog.close();
    }
  }

  private showAccessRestrictedDialog(): void {
    this.dialogService.fullScreenDialog(
      this.translate.instant('Access restricted'),
      this.translate.instant('Access from your IP is restricted'),
    ).pipe(untilDestroyed(this)).subscribe(() => {
      this.wsManager.reconnect();
    });
  }

  canActivate(): boolean {
    return true;
  }
}
