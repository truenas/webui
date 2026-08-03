import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { WebSocketHandlerService } from 'app/modules/websocket/websocket-handler.service';
import { SystemTaskSplashComponent } from 'app/pages/system-tasks/system-task-splash/system-task-splash.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { WebSocketStatusService } from 'app/services/websocket-status.service';
import { AppState } from 'app/store';
import { selectIsHaEnabled, selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';

@Component({
  selector: 'ix-restart',
  templateUrl: './restart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SystemTaskSplashComponent,
    TranslateModule,
  ],
})
export class RestartComponent implements OnInit {
  private api = inject(ApiService);
  private wsManager = inject(WebSocketHandlerService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private errorHandler = inject(ErrorHandlerService);
  private dialogService = inject(DialogService);
  private location = inject(Location);
  private wsStatus = inject(WebSocketStatusService);
  private store$ = inject<Store<AppState>>(Store);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  private isHaLicensed = toSignal(this.store$.select(selectIsHaLicensed));
  private isHaEnabled = toSignal(this.store$.select(selectIsHaEnabled));

  ngOnInit(): void {
    const reason = this.route.snapshot.queryParamMap.get('reason') || 'Unknown Reason';

    // Replace URL so that we don't restart again if page is refreshed.
    this.location.replaceState('/signin');

    this.dialogService.closeAllDialogs();
    this.api.job('system.reboot', [reason]).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      error: (error: unknown) => { // error on restart
        this.errorHandler.showErrorModal(error)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => {
            this.authService.clearAuthToken();
            this.router.navigate(['/signin']);
          });
      },
      complete: () => { // show restart screen
        if (this.isHaLicensed() && this.isHaEnabled()) {
          this.wsStatus.setReconnectAllowed(false);
        }
        this.wsManager.prepareShutdown();
        this.authService.clearAuthToken();
        this.wsManager.reconnect();
        const navigateTimeout = setTimeout(() => {
          this.router.navigate(['/signin']);
        }, 5000);
        this.destroyRef.onDestroy(() => clearTimeout(navigateTimeout));
      },
    });
  }
}
