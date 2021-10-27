import { AutofillMonitor } from '@angular/cdk/text-field';
import { HttpClient } from '@angular/common/http';
import {
  Component, OnInit, ViewChild, OnDestroy, ElementRef, AfterViewInit,
} from '@angular/core';
import {
  FormBuilder, FormGroup, Validators, FormControl, AbstractControl,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { ApiService } from 'app/core/services/api.service';
import { CoreService } from 'app/core/services/core-service/core.service';
import { FailoverDisabledReason } from 'app/enums/failover-disabled-reason.enum';
import { FailoverStatus } from 'app/enums/failover-status.enum';
import { ProductType, ProductTypeReadableText } from 'app/enums/product-type.enum';
import globalHelptext from 'app/helptext/global-helptext';
import productText from 'app/helptext/product';
import helptext from 'app/helptext/topbar';
import { ThemeChangedEvent } from 'app/interfaces/events/theme-events.interface';
import { Interval } from 'app/interfaces/timeout.interface';
import { matchOtherValidator } from 'app/pages/common/entity/entity-form/validators/password-validation/password-validation';
import { SystemGeneralService } from 'app/services';
import { DialogService } from 'app/services/dialog.service';
import { LocaleService } from 'app/services/locale.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.scss'],
})
export class SigninComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(MatProgressBar, { static: false }) progressBar: MatProgressBar;
  @ViewChild(MatButton, { static: false }) submitButton: MatButton;
  @ViewChild('username', { read: ElementRef }) usernameInput: ElementRef<HTMLElement>;

  failed = false;
  product_type: ProductType;
  productTypeReadableText: string;
  logo_ready = false;
  product = productText.product;
  ha_info_ready = false;
  checking_status = false;

  _copyrightYear = '';
  get copyrightYear(): string {
    return window.localStorage && window.localStorage.buildtime ? this.localeService.getCopyrightYearFromBuildTime() : '';
  }

  private interval: Interval;
  tokenObservable: Subscription;
  HAInterval: Interval;
  isTwoFactor = false;
  private didSetFocus = false;

  signinData = {
    username: '',
    password: '',
    otp: '',
  };
  setPasswordFormGroup: FormGroup;
  has_root_password = true;
  failover_status: FailoverStatus;
  failover_statuses = {
    [FailoverStatus.Single]: '',
    [FailoverStatus.Master]: this.translate.instant('Active {controller}.', { controller: globalHelptext.Ctrlr }),
    [FailoverStatus.Backup]: this.translate.instant('Standby {controller}.', { controller: globalHelptext.Ctrlr }),
    [FailoverStatus.Electing]: this.translate.instant('Electing {controller}.', { controller: globalHelptext.Ctrlr }),
    [FailoverStatus.Importing]: this.translate.instant('Importing pools.'),
    [FailoverStatus.Error]: this.translate.instant('Failover is in an error state.'),
  };
  failover_ips: string[] = [];
  ha_disabled_reasons: FailoverDisabledReason[] = [];
  show_reasons = false;
  reason_text = helptext.ha_disabled_reasons;
  ha_status_text = this.translate.instant('Checking HA status');
  ha_status = false;
  tc_ip: string;
  protected tc_url: string;

  readonly ProductType = ProductType;
  readonly FailoverStatus = FailoverStatus;

  constructor(
    private ws: WebSocketService,
    private router: Router,
    private snackBar: MatSnackBar,
    public translate: TranslateService,
    private dialogService: DialogService,
    private fb: FormBuilder,
    private core: CoreService,
    private api: ApiService,
    private _autofill: AutofillMonitor,
    private http: HttpClient,
    private sysGeneralService: SystemGeneralService,
    private localeService: LocaleService,
  ) {
    this.ws = ws;
    const ha_status = window.sessionStorage.getItem('ha_status');
    if (ha_status && ha_status === 'true') {
      this.ha_status = true;
    }
    this.checkSystemType();
    this.ws.call('truecommand.connected').pipe(untilDestroyed(this)).subscribe((res) => {
      if (res.connected) {
        this.tc_ip = res.truecommand_ip;
        this.tc_url = res.truecommand_url;
      }
    });
  }

  checkSystemType(): void {
    if (!this.logo_ready) {
      this.sysGeneralService.getProductType$.pipe(untilDestroyed(this)).subscribe((res) => {
        this.logo_ready = true;
        this.product_type = res as ProductType;
        this.productTypeReadableText = ProductTypeReadableText.get(this.product_type);
        if (this.interval) {
          clearInterval(this.interval);
        }
        if (this.product_type.includes(ProductType.Enterprise) || this.product_type === ProductType.Scale) {
          if (this.HAInterval) {
            clearInterval(this.HAInterval);
          }
          this.getHAStatus();
          this.HAInterval = setInterval(() => {
            this.getHAStatus();
          }, 6000);
        } else if (this.canLogin()) {
          this.checkBuildtime();
          this.loginToken();
        }
        window.localStorage.setItem('product_type', res);
      });
    }
  }

  ngAfterViewInit(): void {
    this._autofill.monitor(this.usernameInput).pipe(untilDestroyed(this)).subscribe(() => {
      if (!this.didSetFocus) {
        this.didSetFocus = true;
        this.usernameInput.nativeElement.focus();
      }
    });
  }

  ngOnInit(): void {
    this.core.register({ observerClass: this, eventName: 'ThemeChanged' }).pipe(untilDestroyed(this)).subscribe((evt: ThemeChangedEvent) => {
      if (this.router.url == '/sessions/signin' && evt.sender.userThemeLoaded) {
        this.redirect();
      }
    });
    if (!this.logo_ready) {
      this.interval = setInterval(() => {
        this.checkSystemType();
      }, 5000);
    }

    if (this.canLogin()) {
      this.checkBuildtime();
      this.loginToken();
    }

    this.ws.call('user.has_root_password').pipe(untilDestroyed(this)).subscribe((res) => {
      this.has_root_password = res;
    });

    this.setPasswordFormGroup = this.fb.group({
      password: new FormControl('', [Validators.required]),
      password2: new FormControl('', [Validators.required, matchOtherValidator('password')]),
    });

    this.ws.call('auth.two_factor_auth').pipe(untilDestroyed(this)).subscribe((res) => {
      this.isTwoFactor = res;
    });
  }

  ngOnDestroy(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
    if (this.HAInterval) {
      clearInterval(this.HAInterval);
    }
    this.core.unregister({ observerClass: this });
    if (this.tokenObservable) {
      this.tokenObservable.unsubscribe();
    }
  }

  disabledReason(reason: FailoverDisabledReason): FailoverDisabledReason {
    return reason;
  }

  loginToken(): void {
    let middleware_token;
    if (window.localStorage.getItem('middleware_token')) {
      middleware_token = window.localStorage.getItem('middleware_token');
      window.localStorage.removeItem('middleware_token');
    }

    if (middleware_token) {
      this.ws.loginToken(middleware_token)
        .pipe(untilDestroyed(this)).subscribe((result) => {
          this.loginCallback(result);
        });
    }
    if (this.ws.token && this.ws.redirectUrl != undefined) {
      if (this.submitButton) {
        this.submitButton.disabled = true;
      }
      if (this.progressBar) {
        this.progressBar.mode = 'indeterminate';
      }

      if (sessionStorage.currentUrl != undefined) {
        this.ws.redirectUrl = sessionStorage.currentUrl;
      }

      this.ws.loginToken(this.ws.token)
        .pipe(untilDestroyed(this)).subscribe((result) => { this.loginCallback(result); });
    }
  }

  checkBuildtime(): void {
    this.ws.call('system.build_time').pipe(untilDestroyed(this)).subscribe((buildTime) => {
      const buildtime = String(buildTime.$date);
      const previous_buildtime = window.localStorage.getItem('buildtime');
      if (buildtime !== previous_buildtime) {
        window.localStorage.setItem('buildtime', buildtime);
        this._copyrightYear = this.localeService.getCopyrightYearFromBuildTime();
      }
    });
  }

  canLogin(): boolean {
    if (this.logo_ready && this.connected
       && (this.failover_status === FailoverStatus.Single
        || this.failover_status === FailoverStatus.Master
        || this.product_type === ProductType.Core)) {
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
    return this.product_type?.includes(ProductType.Enterprise) || this.product_type === ProductType.Scale;
  }

  getHAStatus(): void {
    if (this.productSupportsHa && !this.checking_status) {
      this.checking_status = true;
      this.ws.call('failover.status').pipe(untilDestroyed(this)).subscribe((failoverStatus) => {
        this.failover_status = failoverStatus;
        this.ha_info_ready = true;
        if (failoverStatus !== FailoverStatus.Single) {
          this.ws.call('failover.get_ips').pipe(untilDestroyed(this)).subscribe((ips) => {
            this.failover_ips = ips;
          }, (err) => {
            console.error(err);
          });
          this.ws.call('failover.disabled_reasons').pipe(untilDestroyed(this)).subscribe((reasons) => {
            this.checking_status = false;
            this.ha_disabled_reasons = reasons;
            this.show_reasons = false;
            if (reasons.length === 0) {
              this.ha_status_text = this.translate.instant('HA is enabled.');
              this.ha_status = true;
            } else if (reasons.length === 1) {
              if (reasons[0] === FailoverDisabledReason.NoSystemReady) {
                this.ha_status_text = this.translate.instant('HA is reconnecting.');
              } else if (reasons[0] === FailoverDisabledReason.NoFailover) {
                this.ha_status_text = this.translate.instant('HA is administratively disabled.');
              }
              this.ha_status = false;
            } else {
              this.ha_status_text = this.translate.instant('HA is in a faulted state');
              this.show_reasons = true;
              this.ha_status = false;
            }
            window.sessionStorage.setItem('ha_status', this.ha_status.toString());
            if (this.canLogin()) {
              this.checkBuildtime();
              this.loginToken();
            }
          }, (err) => {
            this.checking_status = false;
            console.error(err);
          },
          () => {
            this.checking_status = false;
          });
        } else if (this.canLogin()) {
          this.checkBuildtime();
          this.loginToken();
        }
      }, (err) => {
        this.checking_status = false;
        console.error(err);
      });
    }
  }

  get password(): AbstractControl {
    return this.setPasswordFormGroup.get('password');
  }
  get password2(): AbstractControl {
    return this.setPasswordFormGroup.get('password2');
  }

  connected(): boolean {
    return this.ws.connected;
  }

  signin(): void {
    this.submitButton.disabled = true;
    this.progressBar.mode = 'indeterminate';

    if (this.isTwoFactor) {
      this.ws.login(this.signinData.username, this.signinData.password, this.signinData.otp)
        .pipe(untilDestroyed(this)).subscribe((result) => { this.loginCallback(result); });
    } else {
      this.ws.login(this.signinData.username, this.signinData.password)
        .pipe(untilDestroyed(this)).subscribe((result) => { this.loginCallback(result); });
    }
  }

  setpassword(): void {
    this.ws.call('user.set_root_password', [this.password.value]).pipe(untilDestroyed(this)).subscribe(
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
      if (this.interval) {
        clearInterval(this.interval);
      }
      if (this.HAInterval) {
        clearInterval(this.HAInterval);
      }
      if (this.ws.redirectUrl) {
        this.router.navigateByUrl(this.ws.redirectUrl);
        this.ws.redirectUrl = '';
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
    this.snackBar.open(this.translate.instant(message), this.translate.instant('close'), { duration: 4000 });
  }

  openIX(): void {
    window.open('https://www.ixsystems.com/', '_blank');
  }

  gotoTC(): void {
    this.dialogService.generalDialog({
      title: helptext.tcDialog.title,
      message: helptext.tcDialog.message,
      is_html: true,
      confirmBtnMsg: helptext.tcDialog.confirmBtnMsg,
    }).pipe(untilDestroyed(this)).subscribe((res) => {
      if (res) {
        window.open(this.tc_url);
      }
    });
  }
}
