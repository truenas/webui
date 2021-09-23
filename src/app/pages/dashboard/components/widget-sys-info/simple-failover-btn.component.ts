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
    const dialogRef = this.dialog.open(SimpleFailoverBtnDialogComponent, {
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
  templateUrl: './simple-failover-btn-dialog.component.html',
})
export class SimpleFailoverBtnDialogComponent {
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
    public dialogRef: MatDialogRef<SimpleFailoverBtnDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }
}
