import { Component, OnInit, ViewChild } from '@angular/core';
import { MdProgressBar, MdButton } from '@angular/material';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {
  @ViewChild(MdProgressBar) progressBar: MdProgressBar;
  @ViewChild(MdButton) submitButton: MdButton;
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
