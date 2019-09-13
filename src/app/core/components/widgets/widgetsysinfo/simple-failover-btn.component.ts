import { Component, Input, Inject, OnDestroy } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { helptext_system_failover } from 'app/helptext/system/failover';

interface DialogData {
  agreed: boolean;
}

@Component({
  selector: 'simple-failover-button',
  template: `<button mat-button [color]="color" (click)="openDialog()">INITIATE FAILOVER</button>`,
})

export class SimpleFailoverBtnComponent implements OnDestroy {

  @Input() color:string = 'default';
  constructor(
    private dialog: MatDialog,
    protected matDialog: MatDialog,
    private router: Router,
    public translate: TranslateService) {}

  afterInit() {
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(SimpleFailoverBtnDialog, {
      width: '330px',
      data: { agreed: true}
    });

    dialogRef.afterClosed().subscribe(res => {
      if(res){
        this.router.navigate(['/others/reboot']);
      }
    });
  }
 

  ngOnDestroy() { 
  }

}

@Component({
  selector: 'simple-failover-btn-dialog',
  template: `
    <h1 mat-dialog-title>{{title | translate}}</h1>
    <div mat-dialog-content>{{msg1 | translate}}</div>
    <div mat-dialog-actions fxLayout="row wrap">
      <mat-checkbox fxFlex="80px" fxFlex.xs="100" class="confirm-checkbox" color="accent" [(ngModel)]="confirmed" style="margin:0 16px 16px 0;">{{checkbox | translate}}</mat-checkbox>
      <button fxFlex="calc(45% - 40px)" fxFlex.xs="45" style="margin-bottom:16px;" mat-button color="accent" (click)="onNoClick()" cdkFocusInitial>{{cancel | translate}}</button>
      <button fxFlex="calc(45% - 40px)" fxFlex.xs="45" style="margin-bottom:16px;" mat-button color="primary" [disabled]="isDisabled" [mat-dialog-close]="data.agreed">{{action | translate}}</button>
    </div>
  `
})
export class SimpleFailoverBtnDialog {

  private _confirmed: boolean;
  get confirmed(){
    return this._confirmed;
  }

  set confirmed(v){
    this._confirmed = v;
    this.isDisabled = !v;
  }

  public isDisabled = true;
  public title = helptext_system_failover.dialog_initiate_failover_title;
  public msg1 = helptext_system_failover.dialog_initiate_failover_message;
  public checkbox = helptext_system_failover.dialog_initiate_failover_checkbox;
  public cancel = helptext_system_failover.dialog_initiate_cancel;
  public action = helptext_system_failover.dialog_initiate_action;

  constructor(
    public dialogRef: MatDialogRef<SimpleFailoverBtnDialog>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData) {}

  onNoClick(): void {
    this.dialogRef.close();
  }

}
