import { MdDialog, MdDialogRef} from '@angular/material';
import { Component, OnInit } from '@angular/core';
import * as _ from 'lodash';
import {
  RestService,
  SystemGeneralService,
  WebSocketService
} from '../../../../services/';

@Component({
  selector: 'testalerts-dialog',
  styleUrls: ['./testalerts-dialog.component.css'],
  templateUrl:'./testalerts-dialog.component.html'
})
export class TestAlertModalDialogComponent implements OnInit {

  

  constructor(
    public dialogRef: MdDialogRef<TestAlertModalDialogComponent>) { }

  ngOnInit() {
    
  }

}
