import { Component, OnInit, ViewChild } from '@angular/core';
import { MdProgressBar, MdButton } from '@angular/material';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.css']
})
export class SigninComponent implements OnInit {
  @ViewChild(MdProgressBar) progressBar: MdProgressBar;
  @ViewChild(MdButton) submitButton: MdButton;

  signinData = {
    username: '',
    password: ''
  }
  constructor() { }

  ngOnInit() {
  }

  signin() {
    console.log(this.signinData);

    this.submitButton.disabled = true;
    this.progressBar.mode = 'indeterminate';
  }

}
