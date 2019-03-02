import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatProgressBar, MatButton, MatSnackBar } from '@angular/material';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Http } from '@angular/http';
import { matchOtherValidator } from '../../../pages/common/entity/entity-form/validators/password-validation';
import { TranslateService } from '@ngx-translate/core';
import globalHelptext from '../../../helptext/global-helptext';

import { T } from '../../../translate-marker';
import {WebSocketService} from '../../../services/ws.service';
import { DialogService } from '../../../services/dialog.service';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { ApiService } from 'app/core/services/api.service';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.css']
})
export class SigninComponent implements OnInit {
  @ViewChild(MatProgressBar) progressBar: MatProgressBar;
  @ViewChild(MatButton) submitButton: MatButton;

  private failed: Boolean = false;
  public is_freenas: Boolean = false;
  public logo_ready: Boolean = false;
  public showPassword = false;
  public copyrightYear = globalHelptext.copyright_year;

  signinData = {
    username: '',
    password: ''
  }
  public setPasswordFormGroup: FormGroup;
  public has_root_password: Boolean = true;

  constructor(private ws: WebSocketService, private router: Router,
    private snackBar: MatSnackBar, public translate: TranslateService,
    private dialogService: DialogService,
    private fb: FormBuilder,
    private core: CoreService,
    private api:ApiService,
    private http:Http) {
    this.ws = ws;
    this.ws.call('system.is_freenas').subscribe((res)=>{
      this.logo_ready = true;
      this.is_freenas = res;
      window.localStorage.setItem('is_freenas', res);
    });

    this.core.register({observerClass:this, eventName:"ThemeChanged"}).subscribe((evt:CoreEvent) => {
      if (this.router.url == '/sessions/signin' && evt.sender.userThemeLoaded == true) {
        this.redirect();
      }
    })
   }

  ngOnInit() {
    this.ws.call('user.has_root_password').subscribe((res) => {
      this.has_root_password = res;
    });

    let middleware_token;
    if (window['MIDDLEWARE_TOKEN']) {
      middleware_token = window['MIDDLEWARE_TOKEN'];
      window['MIDDLEWARE_TOKEN'] = null;
    } else if (window.localStorage.getItem('middleware_token')) {
      middleware_token = window.localStorage.getItem('middleware_token');
      window.localStorage.removeItem('middleware_token');
    }

    this.http.get('./assets/buildtime').subscribe((res) => {
      const buildtime = res['_body'];
      const previous_buildtime = window.localStorage.getItem('buildtime');
      if (buildtime !== previous_buildtime) {
        window.localStorage.clear();
        window.localStorage.setItem('buildtime', buildtime);
        if (middleware_token) {
          window.localStorage.setItem('middleware_token', middleware_token);
        }
        document.location.reload(true);
      }
    });

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
    this.setPasswordFormGroup = this.fb.group({
      password: new FormControl('', [Validators.required]),
      password2: new FormControl('', [Validators.required, matchOtherValidator('password')]),
    })
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

    this.ws.login(this.signinData.username, this.signinData.password)
                      .subscribe((result) => { this.loginCallback(result); });
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
      if (this.ws.redirectUrl) {
        this.router.navigateByUrl(this.ws.redirectUrl);
        this.ws.redirectUrl = '';
      } else {
        this.router.navigate([ '/dashboard' ]);
      }
      this.core.unregister({observerClass:this});
    }
  }
  successLogin() {
    this.snackBar.dismiss();
    this.ws.call('auth.generate_token', [300]).subscribe((result) => {
      if (result) {
        this.ws.token = result;
      }
    });
  }

  errorLogin() {
    this.submitButton.disabled = false;
    this.failed = true;
    this.progressBar.mode = 'determinate';
    this.signinData.password = '';
    let message = '';
    if (this.ws.token === null) {
      message = 'Username or Password is incorrect.';
    } else {
      message = 'Token expired, please log back in.';
      this.ws.token = null;
    }
    this.translate.get('close').subscribe((ok: string) => {
      this.translate.get(message).subscribe((res: string) => {
        this.snackBar.open(res, ok, {duration: 4000});
      });
    });
  }

  onGoToLegacy() {
    this.dialogService.confirm(T("Log in to Legacy User Interface?"), "", true, T('Continue')).subscribe((res) => {
      if (res) {
        window.location.href = '/legacy/';
      }
    });
  }
}
