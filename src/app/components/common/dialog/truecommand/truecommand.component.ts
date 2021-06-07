import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import helptext from 'app/helptext/topbar';
import { DialogService } from 'app/services/dialog.service';

@UntilDestroy()
@Component({
  selector: 'truecommand-status',
  templateUrl: './truecommand.component.html',
  styleUrls: ['./truecommand.component.scss'],
})
export class TruecommandComponent {
  parent = this.data.parent;
  tc = this.data.data;

  constructor(
    public dialogRef: MatDialogRef<TruecommandComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public translate: TranslateService,
    private dialogService: DialogService,
  ) {}

  gotoTC(): void {
    this.dialogService.generalDialog({
      title: helptext.tcDialog.title,
      message: helptext.tcDialog.message,
      is_html: true,
      confirmBtnMsg: helptext.tcDialog.confirmBtnMsg,
    }).pipe(untilDestroyed(this)).subscribe((res) => {
      if (res) {
        window.open(this.tc.remote_url);
      }
    });
  }

  update(data: any): void {
    this.tc = data;
  }
}
