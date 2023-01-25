import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { AlertSlice } from 'app/modules/alerts/store/alert.selectors';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { DialogService } from 'app/services/dialog.service';
import { WebsocketManagerService } from 'app/services/ws-manager.service';
import { WebSocketService2 } from 'app/services/ws2.service';
import { passiveNodeReplaced } from 'app/store/system-info/system-info.actions';

@UntilDestroy()
@Component({
  templateUrl: './failover.component.html',
  styleUrls: ['./failover.component.scss'],
})
export class FailoverComponent implements OnInit {
  constructor(
    protected ws: WebSocketService2,
    private wsManager: WebsocketManagerService,
    protected router: Router,
    protected loader: AppLoaderService,
    protected dialogService: DialogService,
    protected dialog: MatDialog,
    private location: Location,
    private store$: Store<AlertSlice>,
  ) {}

  isWsConnected(): void {
    this.wsManager.isConnected$.pipe(untilDestroyed(this)).subscribe({
      next: (isConnected) => {
        if (isConnected) {
          this.loader.close();
          // ws is connected
          this.router.navigate(['/session/signin']);
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
    this.location.replaceState('/session/signin');
    this.dialog.closeAll();
    this.ws.call('failover.become_passive').pipe(untilDestroyed(this)).subscribe({
      error: (error: WebsocketError) => { // error on reboot
        this.dialogService.errorReport(String(error.error), error.reason, error.trace.formatted)
          .pipe(untilDestroyed(this))
          .subscribe(() => {
            this.router.navigate(['/session/signin']);
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
