import { Component, OnInit, ViewChild } from '@angular/core';
import {Router} from '@angular/router';
import {MdProgressBar, MdButton, MdSnackBar} from '@angular/material';

import {WebSocketService} from '../../../services/ws.service';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.css']
})
export class SigninComponent implements OnInit {
  @ViewChild(MdProgressBar) progressBar: MdProgressBar;
  @ViewChild(MdButton) submitButton: MdButton;

  private failed: Boolean = false;

  signinData = {
    username: 'root',
    password: ''
  }
  constructor(private ws: WebSocketService, private router: Router, private snackBar: MdSnackBar) {
    this.ws = ws;
   }

  ngOnInit() {
    if (this.ws.username && this.ws.password && this.ws.redirectUrl) {
      this.submitButton.disabled = true;
      this.progressBar.mode = 'indeterminate';

      this.ws.login(this.ws.username, this.ws.password)
                       .subscribe((result) => { this.loginCallback(result); });
    }
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
    if (this.ws.redirectUrl) {
      this.router.navigateByUrl(this.ws.redirectUrl);
      this.ws.redirectUrl = '';
    } else {
      this.router.navigate([ '/dashboard' ]);
    }
  }

  errorLogin() {
    this.failed = true;
    this.progressBar.mode = 'determinate';
    this.signinData.password = '';
    this.signinData.username = 'root';
    this.snackBar.open('Username or Password is incorrect', 'OKAY', {duration: 4000});
  }

}
