import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { TrueCommandStatus } from 'app/enums/true-command-status.enum';
import helptext from 'app/helptext/topbar';
import { TrueCommandConfig } from 'app/interfaces/true-command-config.interface';
import { TruecommandButtonComponent } from 'app/modules/truecommand/truecommand-button.component';
import { DialogService } from 'app/services/dialog.service';

@UntilDestroy()
@Component({
  selector: 'truecommand-status-modal',
  templateUrl: './truecommand-status-modal.component.html',
  styleUrls: ['./truecommand-status-modal.component.scss'],
})
export class TruecommandStatusModalComponent {
  parent = this.data.parent;
  tc = this.data.data;

  readonly TrueCommandStatus = TrueCommandStatus;

  constructor(
    public dialogRef: MatDialogRef<TruecommandStatusModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { parent: TruecommandButtonComponent; data: TrueCommandConfig },
    public translate: TranslateService,
    private dialogService: DialogService,
  ) {}

  goToTrueCommand(): void {
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

  update(data: TrueCommandConfig): void {
    this.tc = data;
  }
}
