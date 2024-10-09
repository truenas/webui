import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { helptextSystemGeneral as helptext } from 'app/helptext/system/general';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { manageConfigurationElements } from 'app/pages/system/general-settings/manage-configuration-menu/manage-configuration-menu.elements';
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
  standalone: true,
  imports: [
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    MatMenuTrigger,
    UiSearchDirective,
    IxIconComponent,
    MatMenu,
    MatMenuItem,
    TranslateModule,
    AsyncPipe,
  ],
})
export class ManageConfigurationMenuComponent {
  protected readonly Role = Role;
  protected isSysAdmin$ = this.authService.isSysAdmin$;
  protected readonly searchableElements = manageConfigurationElements;

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
        this.router.navigate(['/system-tasks/config-reset'], { skipLocationChange: true });
      });
  }
}
