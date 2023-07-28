import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { filter } from 'rxjs/operators';
import { helptextSystemGeneral as helptext } from 'app/helptext/system/general';
import {
  SaveConfigDialogComponent,
} from 'app/pages/system/general-settings/save-config-dialog/save-config-dialog.component';
import {
  UploadConfigDialogComponent,
} from 'app/pages/system/general-settings/upload-config-dialog/upload-config-dialog.component';
import { DialogService } from 'app/services/dialog.service';

@UntilDestroy()
@Component({
  selector: 'ix-manage-configuration-menu',
  templateUrl: './manage-configuration-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManageConfigurationMenuComponent {
  constructor(
    private dialogService: DialogService,
    private matDialog: MatDialog,
    private router: Router,
  ) {}

  onDownloadConfig(): void {
    this.matDialog.open(SaveConfigDialogComponent);
  }

  onUploadConfig(): void {
    this.matDialog.open(UploadConfigDialogComponent);
  }

  onResetDefaults(): void {
    this.dialogService.confirm({
      title: helptext.reset_config_form.title,
      message: helptext.reset_config_form.message,
      buttonText: helptext.reset_config_form.button_text,
    })
      .pipe(
        filter(Boolean),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.router.navigate(['/others/config-reset'], { skipLocationChange: true });
      });
  }
}
