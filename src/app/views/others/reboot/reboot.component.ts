import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketConnectionService } from 'app/services/websocket-connection.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './reboot.component.html',
  styleUrls: ['./reboot.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RebootComponent implements OnInit {
  constructor(
    protected ws: WebSocketService,
    private wsManager: WebSocketConnectionService,
    protected router: Router,
    private errorHandler: ErrorHandlerService,
    protected loader: AppLoaderService,
    protected dialogService: DialogService,
    protected matDialog: MatDialog,
    private location: Location,
  ) {
  }

  ngOnInit(): void {
    // Replace URL so that we don't reboot again if page is refreshed.
    this.location.replaceState('/sessions/signin');

    this.matDialog.closeAll();
    this.ws.job('system.reboot').pipe(untilDestroyed(this)).subscribe({
      error: (error: unknown) => { // error on reboot
        this.dialogService.error(this.errorHandler.parseError(error))
          .pipe(untilDestroyed(this))
          .subscribe(() => {
            this.router.navigate(['/sessions/signin']);
          });
      },
      complete: () => { // show reboot screen
        this.wsManager.prepareShutdown();
        this.wsManager.closeWebSocketConnection();
        setTimeout(() => {
          this.router.navigate(['/sessions/signin']);
        }, 5000);
      },
    });
  }
}
