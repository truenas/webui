import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import { filter } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { helptextSystemGeneral as helptext } from 'app/helptext/system/general';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { manageConfigurationElements } from 'app/pages/system/advanced/manage-configuration-menu/manage-configuration-menu.elements';
import {
  SaveConfigDialog,
} from 'app/pages/system/advanced/manage-configuration-menu/save-config-dialog/save-config-dialog.component';
import {
  UploadConfigDialog,
} from 'app/pages/system/advanced/manage-configuration-menu/upload-config-dialog/upload-config-dialog.component';

@Component({
  selector: 'ix-manage-configuration-menu',
  templateUrl: './manage-configuration-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    MatMenuTrigger,
    UiSearchDirective,
    TnIconComponent,
    MatMenu,
    MatMenuItem,
    TranslateModule,
    AsyncPipe,
  ],
})
export class ManageConfigurationMenuComponent {
  private dialogService = inject(DialogService);
  private matDialog = inject(MatDialog);
  private authService = inject(AuthService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  protected readonly Role = Role;
  protected isSysAdmin$ = this.authService.isSysAdmin$;
  protected readonly searchableElements = manageConfigurationElements;

  onDownloadConfig(): void {
    this.matDialog.open(SaveConfigDialog);
  }

  onUploadConfig(): void {
    this.matDialog.open(UploadConfigDialog);
  }

  onResetToDefaults(): void {
    this.dialogService.confirm({
      title: this.translate.instant(helptext.resetConfigForm.title),
      message: this.translate.instant(helptext.resetConfigForm.message),
      buttonText: this.translate.instant(helptext.resetConfigForm.button),
      buttonColor: 'warn',
    })
      .pipe(
        filter(Boolean),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.router.navigate(['/system-tasks/config-reset'], { skipLocationChange: true });
      });
  }
}
