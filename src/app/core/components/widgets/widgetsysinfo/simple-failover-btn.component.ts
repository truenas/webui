import { Component, Inject, OnDestroy } from '@angular/core';
//import { FailoverComponent } from 'app/pages/system/failover/failover.component';
//import * as _ from 'lodash';
import { AppLoaderService } from "app/services/app-loader/app-loader.service";
import { DialogService } from "app/services/dialog.service";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { MaterialModule } from 'app/appMaterial.module';
import { Router } from '@angular/router';
//import { EntityUtils } from 'app/pages/common/entity/utils';
import { WebSocketService, SnackbarService } from 'app/services/';
import { T } from 'app/translate-marker';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { helptext_system_failover } from 'app/helptext/system/failover';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';

interface DialogData {
  agreed: boolean;
}

@Component({
  selector: 'simple-failover-button',
  template: `<button mat-button (click)="openDialog()">INITIATE FAILOVER</button>`,
  styleUrls: [],
  providers : [ SnackbarService ],
})

export class SimpleFailoverBtnComponent implements OnDestroy {

  constructor(
    private load: AppLoaderService,
    private ds: DialogService,
    private dialog: MatDialog,
    private ws: WebSocketService,
    public snackBar: SnackbarService,
    protected matDialog: MatDialog,
    private router: Router) {}

  afterInit(entityEdit: any) {
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(SimpleFailoverBtnDialog, {
      width: '250px',
      data: { agreed: true}
    });

    dialogRef.afterClosed().subscribe(res => {
      console.log(res);
    });
  }
 

  ngOnDestroy() { 
  }

}

@Component({
  selector: 'simple-failover-btn-dialog',
  template: `
    <h1 mat-dialog-title>CAUTION!</h1>
    <div mat-dialog-content>You are about to failover to the standby node.</div>
    <h4 style="margin-top:16px;">Are you sure?</h4>
    <div mat-dialog-actions>
      <button mat-button (click)="onNoClick()" cdkFocusInitial>Cancel</button>
      <button mat-button [mat-dialog-close]="data.agreed">Ok</button>
    </div>
  `
})
export class SimpleFailoverBtnDialog {

  constructor(
    public dialogRef: MatDialogRef<SimpleFailoverBtnDialog>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData) {}

  onNoClick(): void {
    this.dialogRef.close();
  }

}
