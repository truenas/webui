import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from 'app/modules/auth/auth.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { CopyrightLineComponent } from 'app/modules/layout/copyright-line/copyright-line.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { WebSocketHandlerService } from 'app/modules/websocket/websocket-handler.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { WebSocketStatusService } from 'app/services/websocket-status.service';
import { AppState } from 'app/store';
import { selectIsHaEnabled, selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-restart',
  templateUrl: './restart.component.html',
  styleUrls: ['./restart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    MatCardContent,
    IxIconComponent,
    CopyrightLineComponent,
    TranslateModule,
  ],
})
export class RestartComponent implements OnInit {
  protected api = inject(ApiService);
  private wsManager = inject(WebSocketHandlerService);
  protected router = inject(Router);
  private route = inject(ActivatedRoute);
  private errorHandler = inject(ErrorHandlerService);
  protected loader = inject(LoaderService);
  protected matDialog = inject(MatDialog);
  private location = inject(Location);
  private wsStatus = inject(WebSocketStatusService);
  private store$ = inject<Store<AppState>>(Store);
  private authService = inject(AuthService);

  isHaLicensed = toSignal(this.store$.select(selectIsHaLicensed));
  isHaEnabled = toSignal(this.store$.select(selectIsHaEnabled));

  ngOnInit(): void {
    const reason = this.route.snapshot.queryParamMap.get('reason') || 'Unknown Reason';

    // Replace URL so that we don't restart again if page is refreshed.
    this.location.replaceState('/signin');

    this.matDialog.closeAll();
    this.api.job('system.reboot', [reason]).pipe(untilDestroyed(this)).subscribe({
      error: (error: unknown) => { // error on restart
        this.errorHandler.showErrorModal(error)
          .pipe(untilDestroyed(this))
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
        setTimeout(() => {
          this.router.navigate(['/signin']);
        }, 5000);
      },
    });
  }
}
