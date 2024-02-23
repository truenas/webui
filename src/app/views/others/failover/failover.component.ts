import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { AlertSlice } from 'app/modules/alerts/store/alert.selectors';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketConnectionService } from 'app/services/websocket-connection.service';
import { WebSocketService } from 'app/services/ws.service';
import { passiveNodeReplaced } from 'app/store/system-info/system-info.actions';

@UntilDestroy()
@Component({
  templateUrl: './failover.component.html',
  styleUrls: ['./failover.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FailoverComponent implements OnInit {
  constructor(
    protected ws: WebSocketService,
    private errorHandler: ErrorHandlerService,
    private wsManager: WebSocketConnectionService,
    protected router: Router,
    protected loader: AppLoaderService,
    protected dialogService: DialogService,
    protected matDialog: MatDialog,
    private location: Location,
    private store$: Store<AlertSlice>,
  ) {}

  isWsConnected(): void {
    this.wsManager.isConnected$.pipe(untilDestroyed(this)).subscribe({
      next: (isConnected) => {
        if (isConnected) {
          this.loader.close();
          // ws is connected
          this.router.navigate(['/sessions/signin']);
        } else {
          setTimeout(() => {
            this.isWsConnected();
          }, 5000);
        }
      },
    });
  }

  ngOnInit(): void {
    // Replace URL so that we don't reboot again if page is refreshed.
    this.location.replaceState('/sessions/signin');
    this.matDialog.closeAll();
    this.ws.call('failover.become_passive').pipe(untilDestroyed(this)).subscribe({
      error: (error: unknown) => { // error on reboot
        this.dialogService.error(this.errorHandler.parseError(error))
          .pipe(untilDestroyed(this))
          .subscribe(() => {
            this.router.navigate(['/sessions/signin']);
          });
      },
      complete: () => { // show reboot screen
        this.store$.dispatch(passiveNodeReplaced());

        this.wsManager.prepareShutdown();
        this.loader.open();
        setTimeout(() => {
          this.isWsConnected();
        }, 1000);
      },
    });
  }
}
