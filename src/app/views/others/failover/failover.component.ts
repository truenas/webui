import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { WebSocketService } from 'app/services';
import { DialogService } from 'app/services/dialog.service';

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
        setTimeout(() => {
          this.isWsConnected();
        }, 1000);
      },
    });
  }
}
