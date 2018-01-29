import { Component, OnInit, ViewChild } from '@angular/core';
import { MatProgressBar, MatButton } from '@angular/material';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {
  @ViewChild(MatProgressBar) progressBar: MatProgressBar;
  @ViewChild(MatButton) submitButton: MatButton;
  signupData = {
    email: '',
    password: '',
    confirmPassword: '',
    isAgreed: ''
  };

  constructor() {}

  ngOnInit() {
  }

  signup() {
    console.log(this.signupData);

    this.submitButton.disabled = true;
    this.progressBar.mode = 'indeterminate';
  }

}
