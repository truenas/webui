import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { AlertSlice } from 'app/modules/alerts/store/alert.selectors';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { LoaderService } from 'app/modules/loader/loader.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { WebSocketHandlerService } from 'app/modules/websocket/websocket-handler.service';
import { SystemTaskRedirectService } from 'app/pages/system-tasks/services/system-task-redirect.service';
import { SystemTaskSplashComponent } from 'app/pages/system-tasks/system-task-splash/system-task-splash.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { WebSocketStatusService } from 'app/services/websocket-status.service';
import { passiveNodeReplaced } from 'app/store/system-info/system-info.actions';

@Component({
  selector: 'ix-failover',
  templateUrl: './failover.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SystemTaskSplashComponent,
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
  private redirect = inject(SystemTaskRedirectService);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
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
        this.redirect.goToSigninWhenSystemIsBack(this.destroyRef);
      },
    });
  }
}
