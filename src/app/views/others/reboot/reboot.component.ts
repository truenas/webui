import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebsocketConnectionService } from 'app/services/websocket-connection.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './reboot.component.html',
  styleUrls: ['./reboot.component.scss'],
})
export class RebootComponent implements OnInit {
  constructor(
    protected ws: WebSocketService,
    private wsManager: WebsocketConnectionService,
    protected router: Router,
    private errorHandler: ErrorHandlerService,
    protected loader: AppLoaderService,
    protected dialogService: DialogService,
    protected dialog: MatDialog,
    private location: Location,
  ) {
  }

  ngOnInit(): void {
    // Replace URL so that we don't reboot again if page is refreshed.
    this.location.replaceState('/sessions/signin');

    this.dialog.closeAll();
    this.ws.job('system.reboot').pipe(untilDestroyed(this)).subscribe({
      error: (error: WebsocketError) => { // error on reboot
        this.dialogService.error(this.errorHandler.parseWsError(error))
          .pipe(untilDestroyed(this))
          .subscribe(() => {
            this.router.navigate(['/sessions/signin']);
          });
      },
      complete: () => { // show reboot screen
        this.wsManager.prepareShutdown();
        this.wsManager.closeWebsocketConnection();
        setTimeout(() => {
          this.router.navigate(['/sessions/signin']);
        }, 5000);
      },
    });
  }
}
