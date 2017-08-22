import { Component, OnInit, ViewChild } from '@angular/core';
import { MdProgressBar, MdButton } from '@angular/material';
@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent implements OnInit {
  userEmail;
  @ViewChild(MdProgressBar) progressBar: MdProgressBar;
  @ViewChild(MdButton) submitButton: MdButton;
  constructor() { }

  ngOnInit() {
  }
  submitEmail() {
    this.submitButton.disabled = true;
    this.progressBar.mode = 'indeterminate';
  }
}
