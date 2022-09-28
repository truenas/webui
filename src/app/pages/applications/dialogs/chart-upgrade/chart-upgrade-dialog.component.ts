import {
  Component, Inject,
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { appImagePlaceholder } from 'app/constants/catalog.constants';
import helptext from 'app/helptext/apps/apps';
import { UpgradeSummary } from 'app/interfaces/application.interface';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { ApplicationsService } from 'app/pages/applications/applications.service';
import { ChartUpgradeDialogConfig } from 'app/pages/applications/interfaces/chart-upgrade-dialog-config.interface';
import { DialogService } from 'app/services';

type Version = Omit<UpgradeSummary, 'upgrade_version' | 'image_update_available' | 'upgrade_human_version'> & { fetched?: boolean };

@UntilDestroy()
@Component({
  styleUrls: ['./chart-upgrade-dialog.component.scss'],
  templateUrl: './chart-upgrade-dialog.component.html',
})
export class ChartUpgradeDialogComponent {
  dialogConfig: ChartUpgradeDialogConfig;
  imagePlaceholder = appImagePlaceholder;
  helptext = helptext;
  versionOptions: Record<string, Version> = {};
  selectedVersionKey: string;
  selectedVersion: Version;

  constructor(
    public dialogRef: MatDialogRef<ChartUpgradeDialogComponent>,
    private appLoaderService: AppLoaderService,
    private appService: ApplicationsService,
    public dialogService: DialogService,
    @Inject(MAT_DIALOG_DATA) public data: ChartUpgradeDialogConfig,
  ) {
    this.dialogConfig = data;

    this.versionOptions[this.dialogConfig.upgradeSummary.latest_version] = this.dialogConfig.upgradeSummary;
    this.versionOptions[this.dialogConfig.upgradeSummary.latest_version].fetched = true;

    if (this.dialogConfig.upgradeSummary.available_versions_for_upgrade) {
      this.dialogConfig.upgradeSummary.available_versions_for_upgrade.forEach((availableVersion) => {
        if (!(availableVersion.version in this.versionOptions)) {
          this.versionOptions[availableVersion.version] = {
            latest_version: availableVersion.version,
            latest_human_version: availableVersion.human_version,
            changelog: null,
            container_images_to_update: null,
            item_update_available: null,
            available_versions_for_upgrade: null,
          };
        }
      });
    }

    this.selectedVersionKey = Object.keys(this.versionOptions)[0];
    this.selectedVersion = this.versionOptions[this.selectedVersionKey];
  }

  hasUpdateImages(): boolean {
    return this.selectedVersion.container_images_to_update
      && Object.keys(this.selectedVersion.container_images_to_update).length > 0;
  }

  onVersionOptionChanged(): void {
    this.selectedVersion = this.versionOptions[this.selectedVersionKey];
    if (!this.selectedVersion.fetched) {
      this.appLoaderService.open();
      this.appService.getUpgradeSummary(this.dialogConfig.appInfo.name, this.selectedVersionKey)
        .pipe(untilDestroyed(this)).subscribe({
          next: (summary: UpgradeSummary) => {
            this.appLoaderService.close();
            this.selectedVersion.changelog = summary.changelog;
            this.selectedVersion.container_images_to_update = summary.container_images_to_update;
            this.selectedVersion.item_update_available = summary.item_update_available;
            this.selectedVersion.fetched = true;
          },
          error: (err) => {
            this.appLoaderService.close();
            this.dialogService.errorReport(err.trace.class, err.reason, err.trace.formatted);
          },
        });
    }
  }

  originalOrder(): number {
    return 0;
  }
}
