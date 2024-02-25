import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { filter } from 'rxjs/operators';
import { Role } from 'app/enums/role.enum';
import { helptextSystemGeneral as helptext } from 'app/helptext/system/general';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  SaveConfigDialogComponent,
} from 'app/pages/system/general-settings/save-config-dialog/save-config-dialog.component';
import {
  UploadConfigDialogComponent,
} from 'app/pages/system/general-settings/upload-config-dialog/upload-config-dialog.component';
import { AuthService } from 'app/services/auth/auth.service';

@UntilDestroy()
@Component({
  selector: 'ix-manage-configuration-menu',
  templateUrl: './manage-configuration-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManageConfigurationMenuComponent {
  protected readonly Role = Role;
  protected isSysAdmin$ = this.authService.isSysAdmin$;

  constructor(
    private dialogService: DialogService,
    private matDialog: MatDialog,
    private authService: AuthService,
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
