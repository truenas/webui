import { MatDialog, MatDialogRef} from '@angular/material';
import { Component, OnInit } from '@angular/core';
import * as _ from 'lodash';
import {
  RestService,
  SystemGeneralService,
  WebSocketService
} from '../../../../services/';

@Component({
  selector: 'testalerts-dialog',
  templateUrl:'./testalerts-dialog.component.html'
})
export class TestAlertModalDialogComponent implements OnInit {

  

  constructor(
    public dialogRef: MatDialogRef<TestAlertModalDialogComponent>) { }

  ngOnInit() {
    
  }

}
