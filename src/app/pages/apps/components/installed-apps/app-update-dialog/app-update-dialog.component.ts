import { KeyValuePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogContent } from '@angular/material/dialog';
import { MatFormField } from '@angular/material/form-field';
import { MatOption, MatSelect } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import { ImgFallbackModule } from 'ngx-img-fallback';
import { appImagePlaceholder } from 'app/constants/catalog.constants';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { helptextApps } from 'app/helptext/apps/apps';
import { AppUpdateDialogConfig } from 'app/interfaces/app-upgrade-dialog-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

interface Version {
  latest_version: string;
  latest_human_version: string;
  available_versions_for_upgrade: {
    version: string;
    human_version: string;
  }[] | null;
}

@Component({
  selector: 'ix-app-update-dialog',
  styleUrls: ['./app-update-dialog.component.scss'],
  templateUrl: './app-update-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogContent,
    ImgFallbackModule,
    MatFormField,
    MatSelect,
    TestDirective,
    FormsModule,
    KeyValuePipe,
    MatOption,
    TranslateModule,
    FormActionsComponent,
    MatButton,
    RequiresRolesDirective,
    IxIconComponent,
  ],
})
export class AppUpdateDialog {
  dialogRef = inject<MatDialogRef<AppUpdateDialog>>(MatDialogRef);
  dialogService = inject(DialogService);
  data = inject<AppUpdateDialogConfig>(MAT_DIALOG_DATA);

  dialogConfig: AppUpdateDialogConfig;
  imagePlaceholder = appImagePlaceholder;
  helptext = helptextApps;
  versionOptions = new Map<string, Version>();
  selectedVersionKey: string;
  selectedVersion: Version | undefined;

  protected readonly requiredRoles = [Role.AppsWrite];

  constructor() {
    const data = this.data;

    this.dialogConfig = data;

    this.versionOptions.set(this.dialogConfig.upgradeSummary.latest_version, {
      latest_version: this.dialogConfig.upgradeSummary.latest_version,
      latest_human_version: this.dialogConfig.upgradeSummary.latest_human_version,
      available_versions_for_upgrade: this.dialogConfig.upgradeSummary.available_versions_for_upgrade,
    });

    if (this.dialogConfig.upgradeSummary.available_versions_for_upgrade) {
      this.dialogConfig.upgradeSummary.available_versions_for_upgrade.forEach((availableVersion) => {
        if (!this.versionOptions.has(availableVersion.version)) {
          this.versionOptions.set(availableVersion.version, {
            latest_version: availableVersion.version,
            latest_human_version: availableVersion.human_version,
            available_versions_for_upgrade: null,
          });
        }
      });
    }

    this.selectedVersionKey = Array.from(this.versionOptions.keys())[0];
    this.selectedVersion = this.versionOptions.get(this.selectedVersionKey);
  }

  onVersionOptionChanged(): void {
    this.selectedVersion = this.versionOptions.get(this.selectedVersionKey);
  }

  originalOrder(): number {
    return 0;
  }
}
