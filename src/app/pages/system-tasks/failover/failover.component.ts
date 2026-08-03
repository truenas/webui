import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { TnCardComponent, TnIconComponent } from '@truenas/ui-components';
import { Timeout } from 'app/interfaces/timeout.interface';
import { AlertSlice } from 'app/modules/alerts/store/alert.selectors';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { CopyrightLineComponent } from 'app/modules/layout/copyright-line/copyright-line.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { WebSocketHandlerService } from 'app/modules/websocket/websocket-handler.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { WebSocketStatusService } from 'app/services/websocket-status.service';
import { passiveNodeReplaced } from 'app/store/system-info/system-info.actions';

@Component({
  selector: 'ix-failover',
  templateUrl: './failover.component.html',
  styleUrls: ['./failover.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnIconComponent,
    CopyrightLineComponent,
    TranslateModule,
  ],
})
export class FailoverComponent implements OnInit {
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private wsManager = inject(WebSocketHandlerService);
  private wsStatus = inject(WebSocketStatusService);
  private router = inject(Router);
  private loader = inject(LoaderService);
  private dialogService = inject(DialogService);
  private location = inject(Location);
  private store$ = inject<Store<AlertSlice>>(Store);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  /** Only one reconnect poll is ever pending, so a single handle covers both schedule sites. */
  private reconnectTimeout: Timeout;

  isWsConnected(): void {
    this.wsStatus.isConnected$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (isConnected) => {
        if (isConnected) {
          this.loader.close();
          // ws is connected
          this.authService.clearAuthToken();
          this.router.navigate(['/signin']);
        } else {
          this.reconnectTimeout = setTimeout(() => {
            this.isWsConnected();
          }, 5000);
        }
      },
    });
  }

  ngOnInit(): void {
    this.destroyRef.onDestroy(() => clearTimeout(this.reconnectTimeout));

    // Replace URL so that we don't restart again if page is refreshed.
    this.location.replaceState('/signin');
    this.wsStatus.setReconnectAllowed(false);
    this.wsStatus.setFailoverStatus(true);

    this.dialogService.closeAllDialogs();
    this.api.call('failover.become_passive').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      error: (error: unknown) => { // error on restart
        this.errorHandler.showErrorModal(error)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => {
            this.router.navigate(['/signin']);
          });
      },
      complete: () => { // show restart screen
        this.store$.dispatch(passiveNodeReplaced());

        this.wsManager.prepareShutdown();
        this.loader.open();
        this.reconnectTimeout = setTimeout(() => {
          this.isWsConnected();
        }, 1000);
      },
    });
  }
}
