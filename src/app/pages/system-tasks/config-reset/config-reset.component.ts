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
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { CopyrightLineComponent } from 'app/modules/layout/copyright-line/copyright-line.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { WebSocketHandlerService } from 'app/modules/websocket/websocket-handler.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { WebSocketStatusService } from 'app/services/websocket-status.service';

@UntilDestroy()
@Component({
  selector: 'ix-config-reset',
  templateUrl: './config-reset.component.html',
  styleUrls: ['./config-reset.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    private wsManager: WebSocketHandlerService,
    private wsStatus: WebSocketStatusService,
    protected router: Router,
    protected loader: LoaderService,
    private errorHandler: ErrorHandlerService,
    public translate: TranslateService,
    protected dialogService: DialogService,
    protected matDialog: MatDialog,
    private location: Location,
    private api: ApiService,
    private authService: AuthService,
  ) {}

  isWsConnected(): void {
    // TODO: isConnected$ doesn't work correctly.
    this.wsStatus.isConnected$.pipe(untilDestroyed(this)).subscribe({
      next: (isConnected) => {
        if (isConnected) {
          this.loader.close();
          this.authService.clearAuthToken();
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
      this.api.job('config.reset', [{ reboot: true }]),
      {
        title: this.translate.instant('Resetting. Please wait...'),
        description: this.translate.instant('Resetting system configuration to default settings. The system will restart.'),
      },
    )
      .afterClosed()
      .pipe(
        this.errorHandler.withErrorHandler(),
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
