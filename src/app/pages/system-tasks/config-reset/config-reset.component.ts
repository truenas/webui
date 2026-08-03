import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { LoaderService } from 'app/modules/loader/loader.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { WebSocketHandlerService } from 'app/modules/websocket/websocket-handler.service';
import { SystemTaskSplashComponent } from 'app/pages/system-tasks/system-task-splash/system-task-splash.component';
import { waitForWebSocketReconnect } from 'app/pages/system-tasks/utils/wait-for-websocket-reconnect';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { WebSocketStatusService } from 'app/services/websocket-status.service';

@Component({
  selector: 'ix-config-reset',
  templateUrl: './config-reset.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SystemTaskSplashComponent,
  ],
})
export class ConfigResetComponent implements OnInit {
  private wsManager = inject(WebSocketHandlerService);
  private wsStatus = inject(WebSocketStatusService);
  private router = inject(Router);
  private loader = inject(LoaderService);
  private errorHandler = inject(ErrorHandlerService);
  private translate = inject(TranslateService);
  private dialogService = inject(DialogService);
  private location = inject(Location);
  private api = inject(ApiService);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    // Replace URL so that we don't reset config again if page is refreshed.
    this.location.replaceState('/signin');

    this.dialogService.closeAllDialogs();
    this.resetConfig();
  }

  private resetConfig(): void {
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
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.wsManager.prepareShutdown();
        this.loader.open();
        this.goToSigninWhenSystemIsBack();
      });
  }

  private goToSigninWhenSystemIsBack(): void {
    waitForWebSocketReconnect(this.wsStatus)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.loader.close();
        this.authService.clearAuthToken();
        this.router.navigate(['/signin']);
      });
  }
}
