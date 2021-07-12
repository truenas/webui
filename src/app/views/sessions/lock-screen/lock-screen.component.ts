import { Component, ViewChild } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatProgressBar } from '@angular/material/progress-bar';

@Component({
  selector: 'app-lockscreen',
  templateUrl: './lock-screen.component.html',
})
export class LockScreenComponent {
  @ViewChild(MatProgressBar, { static: false }) progressBar: MatProgressBar;
  @ViewChild(MatButton, { static: false }) submitButton: MatButton;

  lockscreenData = {
    password: '',
  };

  unlock(): void {
    this.submitButton.disabled = true;
    this.progressBar.mode = 'indeterminate';
  }
}
