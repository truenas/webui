import { Component, ViewChild } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatProgressBar } from '@angular/material/progress-bar';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
})
export class SignupComponent {
  @ViewChild(MatProgressBar, { static: false }) progressBar: MatProgressBar;
  @ViewChild(MatButton, { static: false }) submitButton: MatButton;
  signupData = {
    email: '',
    password: '',
    confirmPassword: '',
    isAgreed: '',
  };

  signup(): void {
    this.submitButton.disabled = true;
    this.progressBar.mode = 'indeterminate';
  }
}
