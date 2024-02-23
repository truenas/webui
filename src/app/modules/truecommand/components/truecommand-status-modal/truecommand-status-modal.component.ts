import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject,
} from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TrueCommandStatus } from 'app/enums/true-command-status.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { helptextTopbar } from 'app/helptext/topbar';
import { TrueCommandConfig } from 'app/interfaces/true-command-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { TruecommandButtonComponent } from 'app/modules/truecommand/truecommand-button.component';

@UntilDestroy()
@Component({
  templateUrl: './truecommand-status-modal.component.html',
  styleUrls: ['./truecommand-status-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TruecommandStatusModalComponent {
  parent = this.data.parent;
  tc = this.data.data;

  readonly TrueCommandStatus = TrueCommandStatus;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { parent: TruecommandButtonComponent; data: TrueCommandConfig },
    @Inject(WINDOW) private window: Window,
    private dialogService: DialogService,
    private cdr: ChangeDetectorRef,
  ) {}

  goToTrueCommand(): void {
    this.dialogService.generalDialog({
      title: helptextTopbar.tcDialog.title,
      message: helptextTopbar.tcDialog.message,
      is_html: true,
      confirmBtnMsg: helptextTopbar.tcDialog.confirmBtnMsg,
    }).pipe(untilDestroyed(this)).subscribe((confirmed) => {
      if (confirmed) {
        this.window.open(this.tc.remote_url);
      }
    });
  }

  update(data: TrueCommandConfig): void {
    this.tc = data;
    this.cdr.detectChanges();
  }
}
