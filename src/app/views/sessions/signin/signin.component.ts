import { AutofillMonitor } from '@angular/cdk/text-field';
import {
  Component, OnInit, ViewChild, OnDestroy, ElementRef, AfterViewInit,
} from '@angular/core';
import {
  UntypedFormBuilder, UntypedFormGroup, Validators, UntypedFormControl, AbstractControl,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { FailoverDisabledReason } from 'app/enums/failover-disabled-reason.enum';
import { FailoverStatus } from 'app/enums/failover-status.enum';
import { ProductType, productTypeLabels } from 'app/enums/product-type.enum';
import { SystemEnvironment } from 'app/enums/system-environment.enum';
import globalHelptext from 'app/helptext/global-helptext';
import productText from 'app/helptext/product';
import helptext from 'app/helptext/topbar';
import { Interval } from 'app/interfaces/timeout.interface';
import { matchOtherValidator } from 'app/modules/entity/entity-form/validators/password-validation/password-validation';
import { SystemGeneralService } from 'app/services';
import { DialogService } from 'app/services/dialog.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.scss'],
})
export class SigninComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(MatProgressBar, { static: false }) progressBar: MatProgressBar;
  @ViewChild(MatButton, { static: false }) submitButton: MatButton;
  @ViewChild('username', { read: ElementRef }) usernameInput: ElementRef<HTMLElement>;

  failed = false;
  productType: ProductType;
  isLogoReady = false;
  product = productText.product;
  isHaInfoReady = false;
  checkingStatus = false;

  tokenObservable: Subscription;
  haInterval: Interval;
  isTwoFactor = false;
  private didSetFocus = false;

  signinData = {
    username: '',
    password: '',
    otp: '',
  };
  setPasswordFormGroup: UntypedFormGroup;
  hasRootPassword = true;
  hasInstanceId = false;
  failoverStatus: FailoverStatus;
  failoverStatuses = {
    [FailoverStatus.Single]: '',
    [FailoverStatus.Master]: this.translate.instant('Active {controller}.', { controller: globalHelptext.Ctrlr }),
    [FailoverStatus.Backup]: this.translate.instant('Standby {controller}.', { controller: globalHelptext.Ctrlr }),
    [FailoverStatus.Electing]: this.translate.instant('Electing {controller}.', { controller: globalHelptext.Ctrlr }),
    [FailoverStatus.Importing]: this.translate.instant('Importing pools.'),
    [FailoverStatus.Error]: this.translate.instant('Failover is in an error state.'),
  };
  failoverIps: string[] = [];
  haDisabledReasons: FailoverDisabledReason[] = [];
  showReasons = false;
  reasonText = helptext.ha_disabled_reasons;
  haStatusText = this.translate.instant('Checking HA status');
  haStatus = false;

  readonly ProductType = ProductType;
  readonly FailoverStatus = FailoverStatus;
  readonly productTypeLabels = productTypeLabels;

  constructor(
    private ws: WebSocketService,
    private router: Router,
    private snackBar: MatSnackBar,
    public translate: TranslateService,
    private dialogService: DialogService,
    private fb: UntypedFormBuilder,
    private autofill: AutofillMonitor,
    private sysGeneralService: SystemGeneralService,
  ) {
    const haStatus = window.sessionStorage.getItem('ha_status');
    if (haStatus && haStatus === 'true') {
      this.haStatus = true;
    }
    this.sysGeneralService.getProductType$.pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe((productType: ProductType) => {
      this.productType = productType;
      this.isLogoReady = true;
      if ([ProductType.Scale, ProductType.ScaleEnterprise].includes(this.productType)) {
        if (this.haInterval) {
          clearInterval(this.haInterval);
        }
        this.getHaStatus();
        this.haInterval = setInterval(() => {
          this.getHaStatus();
        }, 6000);
      } else if (this.canLogin()) {
        this.loginToken();
      }
      window.localStorage.setItem('product_type', this.productType);
    });
  }

  ngAfterViewInit(): void {
    this.autofill.monitor(this.usernameInput).pipe(untilDestroyed(this)).subscribe(() => {
      if (!this.didSetFocus) {
        this.didSetFocus = true;
        this.usernameInput.nativeElement.focus();
      }
    });
  }

  ngOnInit(): void {
    if (this.canLogin()) {
      this.loginToken();
    }

    this.ws.call('user.has_root_password').pipe(untilDestroyed(this)).subscribe((hasRootPassword) => {
      this.hasRootPassword = hasRootPassword;
    });

    this.ws.call('system.environment').pipe(untilDestroyed(this)).subscribe((env) => {
      this.hasInstanceId = env === SystemEnvironment.Ec2;
      if (this.hasInstanceId) {
        this.instanceId.enable();
      } else {
        this.instanceId.disable();
      }
    });

    this.setPasswordFormGroup = this.fb.group({
      password: new UntypedFormControl('', [Validators.required]),
      password2: new UntypedFormControl('', [Validators.required, matchOtherValidator('password')]),
      instanceId: new UntypedFormControl('', [Validators.required]),
    });

    this.ws.call('auth.two_factor_auth').pipe(untilDestroyed(this)).subscribe((hasTwoFactorAuth) => {
      this.isTwoFactor = hasTwoFactorAuth;
    });
  }

  ngOnDestroy(): void {
    if (this.haInterval) {
      clearInterval(this.haInterval);
    }
    if (this.tokenObservable) {
      this.tokenObservable.unsubscribe();
    }
  }

  disabledReason(reason: FailoverDisabledReason): FailoverDisabledReason {
    return reason;
  }

  loginToken(): void {
    let middlewareToken;
    if (window.localStorage.getItem('middleware_token')) {
      middlewareToken = window.localStorage.getItem('middleware_token');
      window.localStorage.removeItem('middleware_token');
    }

    if (middlewareToken) {
      this.ws.loginToken(middlewareToken)
        .pipe(untilDestroyed(this)).subscribe((result) => {
          this.loginCallback(result);
        });
    }
    if (this.ws.token && this.ws.redirectUrl !== undefined) {
      if (this.submitButton) {
        this.submitButton.disabled = true;
      }
      if (this.progressBar) {
        this.progressBar.mode = 'indeterminate';
      }

      if (sessionStorage.currentUrl !== undefined) {
        this.ws.redirectUrl = sessionStorage.currentUrl;
      }

      this.ws.loginToken(this.ws.token)
        .pipe(untilDestroyed(this)).subscribe((result) => { this.loginCallback(result); });
    }
  }

  canLogin(): boolean {
    if (this.isLogoReady && this.connected()
      && [FailoverStatus.Single, FailoverStatus.Master].includes(this.failoverStatus)
    ) {
      if (!this.didSetFocus && this.usernameInput) {
        setTimeout(() => {
          this.didSetFocus = true;
          this.usernameInput.nativeElement.focus();
        }, 10);
      }

      return true;
    }

    return false;
  }

  get productSupportsHa(): boolean {
    return [ProductType.Scale, ProductType.ScaleEnterprise].includes(this.productType);
  }

  getHaStatus(): void {
    if (this.productSupportsHa && !this.checkingStatus) {
      this.checkingStatus = true;
      this.ws.call('failover.status').pipe(untilDestroyed(this)).subscribe({
        next: (failoverStatus) => {
          this.failoverStatus = failoverStatus;
          this.isHaInfoReady = true;
          if (failoverStatus !== FailoverStatus.Single) {
            this.ws.call('failover.get_ips').pipe(untilDestroyed(this)).subscribe({
              next: (ips) => {
                this.failoverIps = ips;
              },
              error: (err) => {
                console.error(err);
              },
            });
            this.ws.call('failover.disabled.reasons').pipe(untilDestroyed(this)).subscribe({
              next: (reasons) => {
                this.checkingStatus = false;
                this.haDisabledReasons = reasons;
                this.showReasons = false;
                if (reasons.length === 0) {
                  this.haStatusText = this.translate.instant('HA is enabled.');
                  this.haStatus = true;
                } else if (reasons.length === 1) {
                  if (reasons[0] === FailoverDisabledReason.NoSystemReady) {
                    this.haStatusText = this.translate.instant('HA is reconnecting.');
                  } else if (reasons[0] === FailoverDisabledReason.NoFailover) {
                    this.haStatusText = this.translate.instant('HA is administratively disabled.');
                  }
                  this.haStatus = false;
                } else {
                  this.haStatusText = this.translate.instant('HA is in a faulted state');
                  this.showReasons = true;
                  this.haStatus = false;
                }
                window.sessionStorage.setItem('ha_status', this.haStatus.toString());
                if (this.canLogin()) {
                  this.loginToken();
                }
              },
              error: (err) => {
                this.checkingStatus = false;
                console.error(err);
              },
              complete: () => {
                this.checkingStatus = false;
              },
            });
          } else if (this.canLogin()) {
            this.loginToken();
          }
        },
        error: (err) => {
          this.checkingStatus = false;
          console.error(err);
        },
      });
    }
  }

  get password(): AbstractControl {
    return this.setPasswordFormGroup.get('password');
  }
  get password2(): AbstractControl {
    return this.setPasswordFormGroup.get('password2');
  }
  get instanceId(): AbstractControl {
    return this.setPasswordFormGroup.get('instanceId');
  }

  connected(): boolean {
    return this.ws.connected;
  }

  signin(): void {
    this.submitButton.disabled = true;
    this.progressBar.mode = 'indeterminate';

    const request$ = this.isTwoFactor
      ? this.ws.login(this.signinData.username, this.signinData.password, this.signinData.otp)
      : this.ws.login(this.signinData.username, this.signinData.password);

    request$.pipe(untilDestroyed(this)).subscribe((result) => this.loginCallback(result));
  }

  setpassword(): void {
    const request$ = this.hasInstanceId
      ? this.ws.call('user.set_root_password', [this.password.value, { instance_id: this.instanceId.value }])
      : this.ws.call('user.set_root_password', [this.password.value]);

    request$.pipe(untilDestroyed(this)).subscribe(
      () => {
        this.ws.login('root', this.password.value)
          .pipe(untilDestroyed(this)).subscribe((result) => { this.loginCallback(result); });
      },
    );
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
      if (this.haInterval) {
        clearInterval(this.haInterval);
      }
      if (this.ws.redirectUrl) {
        this.router.navigateByUrl(this.ws.redirectUrl);
      } else {
        this.router.navigate(['/dashboard']);
      }
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
    this.submitButton.disabled = false;
    this.failed = true;
    this.progressBar.mode = 'determinate';
    this.signinData.password = '';
    this.signinData.otp = '';
    let message = '';
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
