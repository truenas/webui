import { Location } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';
import { WINDOW } from 'app/helpers/window.helper';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { AlertSlice } from 'app/modules/alerts/store/alert.selectors';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { WebSocketService } from 'app/services';
import { DialogService } from 'app/services/dialog.service';
import { haStatusLoaded } from 'app/store/system-info/system-info.actions';

@UntilDestroy()
@Component({
  templateUrl: './failover.component.html',
  styleUrls: ['./failover.component.scss'],
})
export class FailoverComponent implements OnInit {
  constructor(
    protected ws: WebSocketService,
    protected router: Router,
    protected loader: AppLoaderService,
    protected dialogService: DialogService,
    protected dialog: MatDialog,
    private location: Location,
    @Inject(WINDOW) private window: Window,
    private store$: Store<AlertSlice>,
  ) {}

  isWsConnected(): void {
    if (this.ws.connected) {
      this.loader.close();
      // ws is connected
      this.router.navigate(['/session/signin']);
    } else {
      setTimeout(() => {
        this.isWsConnected();
      }, 5000);
    }
  }

  ngOnInit(): void {
    // Replace URL so that we don't reboot again if page is refreshed.
    this.location.replaceState('/session/signin');

    this.dialog.closeAll();
    this.ws.call('failover.become_passive').pipe(untilDestroyed(this)).subscribe({
      error: (res: WebsocketError) => { // error on reboot
        this.dialogService.errorReport(String(res.error), res.reason, res.trace.formatted)
          .pipe(untilDestroyed(this))
          .subscribe(() => {
            this.router.navigate(['/session/signin']);
          });
      },
      complete: () => { // show reboot screen
        this.ws.prepareShutdown();
        this.loader.open();

        this.ws.call('failover.disabled.reasons')
          .pipe(
            map((failoverDisReasons) => {
              const haEnabled = failoverDisReasons.length === 0;
              const enabledText = failoverDisReasons.length === 0 ? 'HA Enabled' : 'HA Disabled';

              this.window.sessionStorage.setItem('ha_status', haEnabled.toString());
              this.store$.dispatch(haStatusLoaded({ haStatus: { status: enabledText, reasons: failoverDisReasons } }));
            }),
            untilDestroyed(this),
          ).subscribe(() => {
            setTimeout(() => {
              this.isWsConnected();
            }, 1000);
          });
      },
    });
  }
}
