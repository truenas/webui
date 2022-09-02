import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy,
} from '@angular/core';
import {
  UntypedFormBuilder,
} from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { combineLatest, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { SystemGeneralService } from 'app/services';
import { LocaleService } from 'app/services/locale.service';
import { WebSocketService } from 'app/services/ws.service';
import { SigninStore } from 'app/views/sessions/signin/store/signin.store';

// TODO: Test mobile
@UntilDestroy()
@Component({
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SigninComponent implements OnInit, OnDestroy {
  readonly hasRootPassword$ = this.signinStore.hasRootPassword$;
  readonly failover$ = this.signinStore.failover$;
  readonly hasFailover$ = this.signinStore.hasFailover$;
  readonly isLoading$ = this.signinStore.isLoading$;
  readonly canLogin$ = this.signinStore.canLogin$;
  readonly isConnected$ = this.ws.isConnected$;
  readonly hasLoadingIndicator$ = combineLatest([this.isLoading$, this.isConnected$]).pipe(
    map(([isLoading, isConnected]) => isLoading || !isConnected),
  );

  tokenObservable: Subscription;
  isTwoFactor = false;

  haStatus = false;

  constructor(
    private ws: WebSocketService,
    private router: Router,
    private snackBar: MatSnackBar,
    public translate: TranslateService,
    private fb: UntypedFormBuilder,
    // private autofill: AutofillMonitor,
    private sysGeneralService: SystemGeneralService,
    private localeService: LocaleService,
    private signinStore: SigninStore,
  ) {
    // TODO: Subscribe to HA status updates
  }

  ngOnInit(): void {
    this.signinStore.init();
  }

  ngOnDestroy(): void {
    if (this.tokenObservable) {
      this.tokenObservable.unsubscribe();
    }
  }

  loginToken(): void {
    // TODO: Token is stored in localstorage through decorator, but it is implicit.
    if (!this.ws.token) {
      return;
    }

    this.ws.loginToken(this.ws.token)
      .pipe(untilDestroyed(this)).subscribe((result) => { this.loginCallback(result); });
  }

  loginCallback(result: boolean): void {
    if (result) {
      this.successLogin();
    } else {
      this.errorLogin();
    }
  }

  redirect(): void {
    if (this.ws.token) {
      this.router.navigateByUrl(this.signinStore.getRedirectUrl());
      this.tokenObservable.unsubscribe();
    }
  }

  successLogin(): void {
    this.snackBar.dismiss();

    this.tokenObservable = this.ws.call('auth.generate_token', [300]).pipe(untilDestroyed(this)).subscribe((token) => {
      if (!token) {
        return;
      }

      this.ws.token = token;
      this.redirect();
    });
  }

  errorLogin(): void {
    let message = '';
    // TODO: Clear password field on unsuccesful login
    if (this.ws.token === null) {
      if (this.isTwoFactor) {
        message = this.translate.instant('Username, Password, or 2FA Code is incorrect.');
      } else {
        message = this.translate.instant('Username or Password is incorrect.');
      }
    } else {
      message = this.translate.instant('Token expired, please log back in.');
      this.ws.token = null;
    }
    this.snackBar.open(
      this.translate.instant(message),
      this.translate.instant('close'),
      { duration: 4000, verticalPosition: 'bottom' },
    );
  }
}
