import { KeyValuePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogContent } from '@angular/material/dialog';
import { MatFormField } from '@angular/material/form-field';
import { MatOption, MatSelect } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import { ImgFallbackModule } from 'ngx-img-fallback';
import { appImagePlaceholder } from 'app/constants/catalog.constants';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { helptextApps } from 'app/helptext/apps/apps';
import { AppUpdateDialogConfig } from 'app/interfaces/app-upgrade-dialog-config.interface';
import { AppUpgradeSummary } from 'app/interfaces/application.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { extractAppVersion, formatVersionWithRevision, resolveAppVersion } from 'app/pages/apps/utils/version-formatting.utils';

type Version = Pick<AppUpgradeSummary, 'latest_version' | 'latest_human_version' | 'latest_app_version' | 'available_versions_for_upgrade'>;

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
    TnIconComponent,
  ],
})
export class AppUpdateDialog {
  protected dialogRef = inject<MatDialogRef<AppUpdateDialog>>(MatDialogRef);
  private data = inject<AppUpdateDialogConfig>(MAT_DIALOG_DATA);

  protected dialogConfig: AppUpdateDialogConfig;
  protected imagePlaceholder = appImagePlaceholder;
  protected helptext = helptextApps;
  protected versionOptions = new Map<string, Version>();
  protected selectedVersionKey: string;
  protected selectedVersion: Version | undefined;
  protected latestAppVersion!: string;
  protected hasAppVersionChange!: boolean;

  protected readonly requiredRoles = [Role.AppsWrite];

  constructor() {
    this.dialogConfig = this.data;

    this.versionOptions.set(this.dialogConfig.upgradeSummary.latest_version, {
      latest_version: this.dialogConfig.upgradeSummary.latest_version,
      latest_human_version: this.dialogConfig.upgradeSummary.latest_human_version,
      latest_app_version: this.dialogConfig.upgradeSummary.latest_app_version,
      available_versions_for_upgrade: this.dialogConfig.upgradeSummary.available_versions_for_upgrade,
    });

    if (this.dialogConfig.upgradeSummary.available_versions_for_upgrade) {
      this.dialogConfig.upgradeSummary.available_versions_for_upgrade.forEach((availableVersion) => {
        if (!this.versionOptions.has(availableVersion.version)) {
          this.versionOptions.set(availableVersion.version, {
            latest_version: availableVersion.version,
            latest_human_version: availableVersion.human_version,
            latest_app_version: availableVersion.app_version,
            available_versions_for_upgrade: null,
          });
        }
      });
    }

    this.selectedVersionKey = Array.from(this.versionOptions.keys())[0];
    this.selectedVersion = this.versionOptions.get(this.selectedVersionKey);
    this.updateVersionInfo();
  }

  onVersionOptionChanged(): void {
    this.selectedVersion = this.versionOptions.get(this.selectedVersionKey);
    this.updateVersionInfo();
  }

  originalOrder(): number {
    return 0;
  }

  getVersionLabel(libraryVersion: string, humanVersion: string): string {
    return formatVersionWithRevision(libraryVersion, humanVersion);
  }

  private updateVersionInfo(): void {
    this.latestAppVersion = resolveAppVersion({
      appVersion: this.selectedVersion?.latest_app_version,
      humanVersion: this.selectedVersion?.latest_human_version,
      libraryVersion: this.selectedVersion?.latest_version ?? this.dialogConfig.upgradeSummary.latest_version,
    });

    const currentAppVersion = extractAppVersion(
      this.dialogConfig.appInfo.human_version,
      this.dialogConfig.appInfo.version,
    );
    this.hasAppVersionChange = currentAppVersion !== this.latestAppVersion;
  }
}
