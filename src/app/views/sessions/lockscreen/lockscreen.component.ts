import { Component, OnInit, ViewChild } from '@angular/core';
import { MatProgressBar, MatButton } from '@angular/material';

@Component({
  selector: 'app-lockscreen',
  templateUrl: './lockscreen.component.html',
  styleUrls: ['./lockscreen.component.css']
})
export class LockscreenComponent implements OnInit {
  @ViewChild(MatProgressBar) progressBar: MatProgressBar;
  @ViewChild(MatButton) submitButton: MatButton;

  lockscreenData = {
    password: ''
  }

  constructor() { }

  ngOnInit() {
  }

  unlock() {
    console.log(this.lockscreenData);

    this.submitButton.disabled = true;
    this.progressBar.mode = 'indeterminate';
  }
}
