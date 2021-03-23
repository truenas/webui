import { Component, OnInit, ViewChild, OnDestroy, ElementRef, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatButton } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { matchOtherValidator } from '../../../pages/common/entity/entity-form/validators/password-validation';
import { TranslateService } from '@ngx-translate/core';
import globalHelptext from '../../../helptext/global-helptext';
import productText from '../../../helptext/product';
import helptext from '../../../helptext/topbar';
import { Observable, Subscription } from 'rxjs';

import { T } from '../../../translate-marker';
import {WebSocketService} from '../../../services/ws.service';
import { SystemGeneralService } from '../../../services';
import { DialogService } from '../../../services/dialog.service';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { ApiService } from 'app/core/services/api.service';
import {AutofillMonitor} from '@angular/cdk/text-field';
import { LocaleService } from 'app/services/locale.service';
@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.scss']
})
export class SigninComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(MatProgressBar, { static: false}) progressBar: MatProgressBar;
  @ViewChild(MatButton, { static: false}) submitButton: MatButton;
  @ViewChild('username', {read: ElementRef}) usernameInput: ElementRef<HTMLElement>;

  private failed: Boolean = false;
  public product_type: string;
  public logo_ready: Boolean = false;
  public product = productText.product;
  public showPassword = false;
  public ha_info_ready = false;
  public checking_status = false;

  public _copyrightYear:string = '';
  get copyrightYear() {
    return window.localStorage && window.localStorage.buildtime ? this.localeService.getCopyrightYearFromBuildTime() : '';
  }

  private interval: any;
  public exposeLegacyUI = false;
  public tokenObservable:Subscription;
  public HAInterval;
  public isTwoFactor = false;
  private didSetFocus = false;

  signinData = {
    username: '',
    password: '',
    otp: ''
  }
  public setPasswordFormGroup: FormGroup;
  public has_root_password: Boolean = true;
  public failover_status = '';
  public failover_statuses = {
    'SINGLE': "",
    'MASTER': T(`Active ${globalHelptext.Ctrlr}.`),
    'BACKUP': T(`Standby ${globalHelptext.Ctrlr}.`),
    'ELECTING': T(`Electing ${globalHelptext.Ctrlr}.`),
    'IMPORTING': T("Importing pools."),
    'ERROR': T("Failover is in an error state.")
  }
  public failover_ips = [];
  public ha_disabled_reasons =[];
  public show_reasons = false;
  public reason_text = {};
  public ha_status_text = T('Checking HA status');
  public ha_status = false;
  public tc_ip;
  protected tc_url;
  private getProdType: Subscription;

  constructor(private ws: WebSocketService, private router: Router,
    private snackBar: MatSnackBar, public translate: TranslateService,
    private dialogService: DialogService,
    private fb: FormBuilder,
    private core: CoreService,
    private api:ApiService,
    private _autofill: AutofillMonitor,
    private http:HttpClient, private sysGeneralService: SystemGeneralService, private localeService: LocaleService) {
    this.ws = ws;
    const ha_status = window.sessionStorage.getItem('ha_status');
    if (ha_status && ha_status === 'true') {
      this.ha_status = true;
    }
    this.checkSystemType();
    this.ws.call('truecommand.connected').subscribe((res) => {
      if (res.connected) {
        this.tc_ip = res.truecommand_ip;
        this.tc_url = res.truecommand_url;
      }
    })
    this.reason_text = helptext.ha_disabled_reasons;
   }

  checkSystemType() {
    if (!this.logo_ready) {
      this.getProdType = this.sysGeneralService.getProductType.subscribe((res)=>{
        this.logo_ready = true;
        this.product_type = res;
        if (this.interval) {
          clearInterval(this.interval);
        }
        if (this.product_type.includes('ENTERPRISE') || this.product_type === 'SCALE') {
          if (this.HAInterval) {
            clearInterval(this.HAInterval);
          }
          this.getHAStatus();
          this.HAInterval = setInterval(() => {
            this.getHAStatus();
          }, 6000);
        } else {
          if (this.canLogin()) {
            this.checkBuildtime();
            this.loginToken();
          }
        }
        window.localStorage.setItem('product_type', res);
        if (this.product_type === 'ENTERPRISE' && window.localStorage.exposeLegacyUI === 'true') {
          this.exposeLegacyUI = true;
        }
      });
    }
  }

  ngAfterViewInit() {
    this._autofill.monitor(this.usernameInput).subscribe(e => {
      if (!this.didSetFocus) {
        this.didSetFocus = true;
        this.usernameInput.nativeElement.focus();
      }      
    });
  }

  ngOnInit() {
    this.core.register({observerClass:this, eventName:"ThemeChanged"}).subscribe((evt:CoreEvent) => {
      if (this.router.url == '/sessions/signin' && evt.sender.userThemeLoaded == true) {
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

    this.ws.call('user.has_root_password').subscribe((res) => {
      this.has_root_password = res;
    })

    this.setPasswordFormGroup = this.fb.group({
      password: new FormControl('', [Validators.required]),
      password2: new FormControl('', [Validators.required, matchOtherValidator('password')]),
    });

    this.ws.call('auth.two_factor_auth').subscribe(res => {
      this.isTwoFactor = res;
    })
  }

  ngOnDestroy() {
      if (this.interval) {
        clearInterval(this.interval);
      }
      if (this.HAInterval) {
        clearInterval(this.HAInterval);
      }
      this.core.unregister({observerClass:this});
      if(this.tokenObservable){
        this.tokenObservable.unsubscribe();
      }
      this.getProdType.unsubscribe();
  }

  loginToken() {
    let middleware_token;
    if (window['MIDDLEWARE_TOKEN']) {
      middleware_token = window['MIDDLEWARE_TOKEN'];
      window['MIDDLEWARE_TOKEN'] = null;
    } else if (window.localStorage.getItem('middleware_token')) {
      middleware_token = window.localStorage.getItem('middleware_token');
      window.localStorage.removeItem('middleware_token');
    }

    if (middleware_token) {
      this.ws.login_token(middleware_token)
      .subscribe((result) => {
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

      this.ws.login_token(this.ws.token)
                       .subscribe((result) => { this.loginCallback(result); });
    }
  }

  checkBuildtime() {
    this.ws.call('system.build_time').subscribe((res) => {
      const buildtime = res.$date;
      const previous_buildtime = window.localStorage.getItem('buildtime');
      if (buildtime !== previous_buildtime) {
        window.localStorage.setItem('buildtime', buildtime);
        this._copyrightYear = this.localeService.getCopyrightYearFromBuildTime();
      }
    });
  }

  canLogin() {
    
    if (this.logo_ready && this.connected &&
       (this.failover_status === 'SINGLE' ||
        this.failover_status === 'MASTER' ||
        this.product_type === 'CORE' )) {

          if (!this.didSetFocus && this.usernameInput) {
            setTimeout(() => {
              this.didSetFocus = true;
              this.usernameInput.nativeElement.focus();            
            }, 10);
            
          }

          return true;
    } else {
      
      return false;
    }
  }

  getHAStatus() {
    if ((this.product_type.includes('ENTERPRISE') || this.product_type === 'SCALE')
      && !this.checking_status) {
      this.checking_status = true;
      this.ws.call('failover.status').subscribe(res => {
        this.failover_status = res;
        this.ha_info_ready = true;
        if (res !== 'SINGLE') {
          this.ws.call('failover.get_ips').subscribe(ips => {
            this.failover_ips = ips;
          }, err => {
            console.log(err);
          });
          this.ws.call('failover.disabled_reasons').subscribe(reason => {
            this.checking_status = false;
            this.ha_disabled_reasons = reason;
            this.show_reasons = false;
            if (reason.length === 0) {
              this.ha_status_text = T('HA is enabled.');
              this.ha_status = true;
            } else if (reason.length === 1) {
              if (reason[0] === 'NO_SYSTEM_READY') {
                this.ha_status_text = T('HA is reconnecting.');
              } else if (reason[0] === 'NO_FAILOVER') {
                this.ha_status_text = T('HA is administratively disabled.');
              }
              this.ha_status = false;
            } else {
              this.ha_status_text = T('HA is in a faulted state');
              this.show_reasons = true;
              this.ha_status = false;
            }
            window.sessionStorage.setItem('ha_status', this.ha_status.toString());
            if (this.canLogin()) {
              this.checkBuildtime();
              this.loginToken();
            }
          }, err => {
            this.checking_status = false;
            console.log(err);
          },
          () => {
            this.checking_status = false;
          });
        } else {
          if (this.canLogin()) {
            this.checkBuildtime();
            this.loginToken();
          }
        }
      }, err => {
        this.checking_status = false;
        console.log(err);
      });
    }
  }

  get password() {
    return this.setPasswordFormGroup.get('password');
  }
  get password2() {
    return this.setPasswordFormGroup.get('password2');
  }

  connected() {
    return this.ws.connected;
  }

  signin() {
    this.submitButton.disabled = true;
    this.progressBar.mode = 'indeterminate';

    if (this.isTwoFactor) {
      this.ws.login(this.signinData.username, this.signinData.password, this.signinData.otp)
      .subscribe((result) => { this.loginCallback(result); });
    } else {     this.ws.login(this.signinData.username, this.signinData.password)
      .subscribe((result) => { this.loginCallback(result); });}
  }

  setpassword() {
    this.ws.call('user.set_root_password', [this.password.value]).subscribe(
      (res)=>{
        this.ws.login('root', this.password.value)
                      .subscribe((result) => { this.loginCallback(result); });
      });
  }

  loginCallback(result) {
    if (result === true) {
      this.successLogin();
    } else {
      this.errorLogin();
    }
  }

  redirect() {
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
        this.router.navigate([ '/dashboard' ]);
      }
      this.tokenObservable.unsubscribe();
    }
  }
  successLogin() {
    this.snackBar.dismiss();
    this.tokenObservable = this.ws.call('auth.generate_token', [300]).subscribe((result) => {
      if (result) {
        this.ws.token = result;
        this.redirect();
      }
    });
  }

  errorLogin() {
    this.submitButton.disabled = false;
    this.failed = true;
    this.progressBar.mode = 'determinate';
    this.signinData.password = '';
    this.signinData.otp = '';
    let message = '';
    if (this.ws.token === null) {
      this.isTwoFactor ? message =
        T('Username, Password, or 2FA Code is incorrect.') :
        message = T('Username or Password is incorrect.');
    } else {
      message = T('Token expired, please log back in.');
      this.ws.token = null;
    }
    this.translate.get('close').subscribe((ok: string) => {
      this.translate.get(message).subscribe((res: string) => {
        this.snackBar.open(res, ok, {duration: 4000});
      });
    });
  }

  onGoToLegacy() {
    this.dialogService.confirm(T("Warning"),
      globalHelptext.legacyUIWarning,
       true, T('Continue to Legacy UI')).subscribe((res) => {
      if (res) {
        window.location.href = '/legacy/';
      }
    });
  }

  openIX() {
    window.open('https://www.ixsystems.com/', '_blank')
  }

  gotoTC() {
    this.dialogService.generalDialog({
      title: helptext.tcDialog.title,
      message: helptext.tcDialog.message,
      is_html: true,
      confirmBtnMsg: helptext.tcDialog.confirmBtnMsg,
    }).subscribe(res => {
      if (res) {
        window.open(this.tc_url);
      }
    })
  }
}
