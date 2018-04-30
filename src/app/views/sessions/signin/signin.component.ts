import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatProgressBar, MatButton, MatSnackBar } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';

import {WebSocketService} from '../../../services/ws.service';

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

  signinData = {
    username: '',
    password: ''
  }
  constructor(private ws: WebSocketService, private router: Router, 
    private snackBar: MatSnackBar, public translate: TranslateService) {
    this.ws = ws;
    this.ws.call('system.is_freenas').subscribe((res)=>{
      this.logo_ready = true;
      this.is_freenas = res;
    });
   }

  ngOnInit() {
    if (this.ws.token && this.ws.redirectUrl) {
      if (this.submitButton) {
        this.submitButton.disabled = true;
      }
      if (this.progressBar) {
        this.progressBar.mode = 'indeterminate';
      }

      this.ws.login_token(this.ws.token)
                       .subscribe((result) => { this.loginCallback(result); });
    }
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

  loginCallback(result) {
    if (result === true) {
      this.successLogin();
    } else {
      this.errorLogin();
    }
  }

  successLogin() {
    this.ws.call('auth.generate_token', [60]).subscribe((result) => {
      if (result) {
        this.ws.token = result;

        if (this.ws.redirectUrl) {
          this.router.navigateByUrl(this.ws.redirectUrl);
          this.ws.redirectUrl = '';
        } else {
          this.router.navigate([ '/dashboard' ]);
        }
      }
    });
  }

  errorLogin() {
    this.submitButton.disabled = false;
    this.failed = true;
    this.progressBar.mode = 'determinate';
    this.signinData.password = '';
    this.signinData.username = '';
    let message = '';
    if (this.ws.token === null) {
      message = 'Username or Password is incorrect';
    } else {
      message = 'Token expired, please log back in';
      this.ws.token = null;
    }
    this.translate.get('Ok').subscribe((ok: string) => {
      this.translate.get(message).subscribe((res: string) => {
        this.snackBar.open(res, ok, {duration: 4000});
      });
    });
  }

}
