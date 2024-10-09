import { Location } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, OnDestroy, OnInit,
} from '@angular/core';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Timeout } from 'app/interfaces/timeout.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { CopyrightLineComponent } from 'app/modules/layout/copyright-line/copyright-line.component';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketConnectionService } from 'app/services/websocket-connection.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-config-reset',
  templateUrl: './config-reset.component.html',
  styleUrls: ['./config-reset.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    MatCardContent,
    IxIconComponent,
    CopyrightLineComponent,
  ],
})
export class ConfigResetComponent implements OnInit, OnDestroy {
  private connectedSubscription: Timeout;

  constructor(
    private wsManager: WebSocketConnectionService,
    protected router: Router,
    protected loader: AppLoaderService,
    private errorHandler: ErrorHandlerService,
    public translate: TranslateService,
    protected dialogService: DialogService,
    protected matDialog: MatDialog,
    private location: Location,
    private ws: WebSocketService,
  ) {}

  isWsConnected(): void {
    // TODO: isConnected$ doesn't work correctly.
    this.wsManager.isConnected$.pipe(untilDestroyed(this)).subscribe({
      next: (isConnected) => {
        if (isConnected) {
          this.loader.close();
          this.router.navigate(['/signin']);
        } else {
          // TODO: Why not just rely on isConnected$ emitting new value.
          this.connectedSubscription = setTimeout(() => {
            this.isWsConnected();
          }, 1000);
        }
      },
    });
  }

  ngOnInit(): void {
    // Replace URL so that we don't reset config again if page is refreshed.
    this.location.replaceState('/signin');

    this.matDialog.closeAll();
    this.resetConfig();
  }

  ngOnDestroy(): void {
    if (this.connectedSubscription) {
      clearTimeout(this.connectedSubscription);
    }
  }

  resetConfig(): void {
    this.dialogService.jobDialog(
      this.ws.job('config.reset', [{ reboot: true }]),
      {
        title: this.translate.instant('Resetting. Please wait...'),
        description: this.translate.instant('Resetting system configuration to default settings. The system will restart.'),
      },
    )
      .afterClosed()
      .pipe(
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.wsManager.prepareShutdown();
        this.loader.open();
        setTimeout(() => {
          this.isWsConnected();
        }, 15000);
      });
  }
}
