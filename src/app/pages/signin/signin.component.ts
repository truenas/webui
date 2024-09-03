import { AsyncPipe } from '@angular/common';
import {
  Component, OnInit, ChangeDetectionStrategy,
  Inject,
} from '@angular/core';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatProgressBar } from '@angular/material/progress-bar';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { combineLatest } from 'rxjs';
import {
  filter, map, switchMap, take,
} from 'rxjs/operators';
import { WINDOW } from 'app/helpers/window.helper';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { DisconnectedMessageComponent } from 'app/pages/signin/disconnected-message/disconnected-message.component';
import { FailoverStatusComponent } from 'app/pages/signin/failover-status/failover-status.component';
import { SetAdminPasswordFormComponent } from 'app/pages/signin/set-admin-password-form/set-admin-password-form.component';
import { SigninFormComponent } from 'app/pages/signin/signin-form/signin-form.component';
import { SigninStore } from 'app/pages/signin/store/signin.store';
import { TrueCommandStatusComponent } from 'app/pages/signin/true-command-status/true-command-status.component';
import { WebSocketConnectionService } from 'app/services/websocket-connection.service';

@UntilDestroy()
@Component({
  selector: 'ix-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatFormField,
    MatInput,
    TestIdModule,
    MatProgressBar,
    MatCard,
    MatCardContent,
    IxIconModule,
    SigninFormComponent,
    SetAdminPasswordFormComponent,
    FailoverStatusComponent,
    TrueCommandStatusComponent,
    LayoutModule,
    DisconnectedMessageComponent,
    AsyncPipe,
  ],
  providers: [SigninStore],
})
export class SigninComponent implements OnInit {
  readonly wasAdminSet$ = this.signinStore.wasAdminSet$;
  readonly failover$ = this.signinStore.failover$;
  readonly hasFailover$ = this.signinStore.hasFailover$;
  readonly canLogin$ = this.signinStore.canLogin$;
  readonly isConnected$ = this.wsManager.isConnected$;
  readonly hasLoadingIndicator$ = combineLatest([this.signinStore.isLoading$, this.isConnected$]).pipe(
    map(([isLoading, isConnected]) => isLoading || !isConnected),
  );

  constructor(
    private wsManager: WebSocketConnectionService,
    private signinStore: SigninStore,
    private dialog: DialogService,
    @Inject(WINDOW) private window: Window,
  ) {}

  ngOnInit(): void {
    this.isConnected$
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => {
        this.signinStore.init();
      });

    this.signinStore.loginBanner$.pipe(
      filter(Boolean),
      filter(() => this.window.sessionStorage.getItem('loginBannerDismissed') !== 'true'),
      switchMap((text) => this.dialog.fullScreenDialog(null, text, true, true).pipe(take(1))),
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe(() => {
      // Restore focus on username input
      this.window.document?.querySelector<HTMLElement>('[ixAutofocus] input')?.focus();
    });
  }
}
