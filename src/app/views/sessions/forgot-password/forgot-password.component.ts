import { Component, OnInit, ViewChild } from '@angular/core';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatButton } from '@angular/material/button';
@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent implements OnInit {
  userEmail;
  @ViewChild(MatProgressBar, { static: false}) progressBar: MatProgressBar;
  @ViewChild(MatButton, { static: false}) submitButton: MatButton;
  constructor() { }

  ngOnInit() {
  }
  submitEmail() {
    this.submitButton.disabled = true;
    this.progressBar.mode = 'indeterminate';
  }
}
