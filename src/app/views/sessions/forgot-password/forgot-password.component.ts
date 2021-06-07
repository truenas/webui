import { Component, ViewChild } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatProgressBar } from '@angular/material/progress-bar';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
})
export class ForgotPasswordComponent {
  userEmail: string;
  @ViewChild(MatProgressBar, { static: false }) progressBar: MatProgressBar;
  @ViewChild(MatButton, { static: false }) submitButton: MatButton;

  submitEmail(): void {
    this.submitButton.disabled = true;
    this.progressBar.mode = 'indeterminate';
  }
}
