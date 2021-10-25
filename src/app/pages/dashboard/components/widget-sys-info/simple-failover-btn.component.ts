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
  templateUrl: './simple-failover-btn.component.html',
  styleUrls: ['./simple-failover-btn.component.scss'],
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
  styleUrls: ['./simple-failover-btn.component.scss'],
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
