import { KeyValue } from '@angular/common';
import {
  Component, Inject,
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { appImagePlaceholder } from 'app/constants/catalog.constants';
import helptext from 'app/helptext/apps/apps';
import { UpgradeSummary } from 'app/interfaces/application.interface';
import { ChartContainerImage } from 'app/interfaces/chart-release.interface';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { ApplicationsService } from 'app/pages/apps-old/applications.service';
import { ChartUpgradeDialogConfig } from 'app/pages/apps-old/interfaces/chart-upgrade-dialog-config.interface';
import { DialogService } from 'app/services';

type Version = Omit<UpgradeSummary, 'upgrade_version' | 'image_update_available' | 'upgrade_human_version'> & { fetched?: boolean };

@UntilDestroy()
@Component({
  styleUrls: ['./app-upgrade-dialog.component.scss'],
  templateUrl: './app-upgrade-dialog.component.html',
})
export class AppUpgradeDialogComponent {
  dialogConfig: ChartUpgradeDialogConfig;
  imagePlaceholder = appImagePlaceholder;
  helptext = helptext;
  versionOptions = new Map<string, Version>();
  selectedVersionKey: string;
  selectedVersion: Version;

  constructor(
    public dialogRef: MatDialogRef<AppUpgradeDialogComponent>,
    private appLoaderService: AppLoaderService,
    private appService: ApplicationsService,
    public dialogService: DialogService,
    @Inject(MAT_DIALOG_DATA) public data: ChartUpgradeDialogConfig,
  ) {
    this.dialogConfig = data;

    this.versionOptions.set(this.dialogConfig.upgradeSummary.latest_version, {
      ...this.dialogConfig.upgradeSummary,
      fetched: true,
    });

    if (this.dialogConfig.upgradeSummary.available_versions_for_upgrade) {
      this.dialogConfig.upgradeSummary.available_versions_for_upgrade.forEach((availableVersion) => {
        if (!this.versionOptions.has(availableVersion.version)) {
          this.versionOptions.set(availableVersion.version, {
            latest_version: availableVersion.version,
            latest_human_version: availableVersion.human_version,
            changelog: null,
            container_images_to_update: null,
            item_update_available: null,
            available_versions_for_upgrade: null,
          });
        }
      });
    }

    this.selectedVersionKey = Array.from(this.versionOptions.keys())[0];
    this.selectedVersion = this.versionOptions.get(this.selectedVersionKey);
  }

  hasUpdateImages(): boolean {
    return this.selectedVersion?.container_images_to_update
      && Object.keys(this.selectedVersion.container_images_to_update).length > 0;
  }

  onVersionOptionChanged(): void {
    this.selectedVersion = this.versionOptions.get(this.selectedVersionKey);
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

  containerImagesOrder(a: KeyValue<string, ChartContainerImage>, b: KeyValue<string, ChartContainerImage>): number {
    return a.value.id.localeCompare(b.value.id);
  }
}
