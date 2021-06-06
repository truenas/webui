import {
  Component, Input, Inject,
} from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { helptext_system_failover } from 'app/helptext/system/failover';

interface DialogData {
  agreed: boolean;
}

@UntilDestroy()
@Component({
  selector: 'simple-failover-button',
  template: `<button mat-button style="opacity:1; background-color: var(--primary) !important; color: var(--primary-txt) !important;" [color]="color" [disabled]="disabled" (click)="openDialog()"
    ix-auto ix-auto-type="button" ix-auto-identifier="Initiate Failover">Initiate Failover</button>`,
})

export class SimpleFailoverBtnComponent {
  @Input() color = 'default';
  @Input() disabled?: boolean = false;
  constructor(
    private dialog: MatDialog,
    protected matDialog: MatDialog,
    private router: Router,
    public translate: TranslateService,
  ) {}

  openDialog(): void {
    const dialogRef = this.dialog.open(SimpleFailoverBtnDialog, {
      width: '330px',
      data: { agreed: true },
    });

    dialogRef.afterClosed().pipe(untilDestroyed(this)).subscribe((res) => {
      if (res) {
        this.router.navigate(['/others/reboot']);
      }
    });
  }
}

@UntilDestroy()
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
  `,
})
export class SimpleFailoverBtnDialog {
  private _confirmed: boolean;
  get confirmed(): boolean {
    return this._confirmed;
  }

  set confirmed(v) {
    this._confirmed = v;
    this.isDisabled = !v;
  }

  isDisabled = true;
  title = helptext_system_failover.dialog_initiate_failover_title;
  msg1 = helptext_system_failover.dialog_initiate_failover_message;
  checkbox = helptext_system_failover.dialog_initiate_failover_checkbox;
  cancel = helptext_system_failover.dialog_initiate_cancel;
  action = helptext_system_failover.dialog_initiate_action;

  constructor(
    public dialogRef: MatDialogRef<SimpleFailoverBtnDialog>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }
}
