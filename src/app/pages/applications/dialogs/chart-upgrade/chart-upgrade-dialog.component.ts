import {
  Component, Inject,
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { appImagePlaceholder } from 'app/constants/catalog.constants';
import helptext from 'app/helptext/apps/apps';
import { UpgradeSummary } from 'app/interfaces/application.interface';
import { ApplicationsService } from 'app/pages/applications/applications.service';
import { ChartUpgradeDialogConfig } from 'app/pages/applications/interfaces/chart-upgrade-dialog-config.interface';
import { DialogService } from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';

@UntilDestroy()
@Component({
  selector: 'chart-upgrade-dialog',
  styleUrls: ['./chart-upgrade-dialog.component.scss'],
  templateUrl: './chart-upgrade-dialog.component.html',
})

export class ChartUpgradeDialog {
  dialogConfig: ChartUpgradeDialogConfig;
  imagePlaceholder = appImagePlaceholder;
  helptext = helptext;
  versionOptions: Record<string, any> = {};
  selectedVersionKey: string;
  selectedVersion: any;

  constructor(
    public dialogRef: MatDialogRef<ChartUpgradeDialog>,
    private appLoaderService: AppLoaderService,
    private appService: ApplicationsService,
    public dialogService: DialogService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    this.dialogConfig = data;

    this.versionOptions[this.dialogConfig.upgradeSummary.latest_version] = {
      version: this.dialogConfig.upgradeSummary.latest_version,
      humanVersion: this.dialogConfig.upgradeSummary.latest_human_version,
      changelog: this.dialogConfig.upgradeSummary.changelog,
      containerImagesToUpdate: this.dialogConfig.upgradeSummary.container_images_to_update,
      itemUpdateAvailable: this.dialogConfig.upgradeSummary.item_update_available,
      fetched: true,
    };

    if (this.dialogConfig.upgradeSummary.available_versions_for_upgrade) {
      this.dialogConfig.upgradeSummary.available_versions_for_upgrade.forEach((availableVersion) => {
        if (!(availableVersion.version in this.versionOptions)) {
          this.versionOptions[availableVersion.version] = {
            version: availableVersion.version,
            humanVersion: availableVersion.human_version,
          };
        }
      });
    }

    this.selectedVersionKey = Object.keys(this.versionOptions)[0];
    this.selectedVersion = this.versionOptions[this.selectedVersionKey];
  }

  hasUpdateImages(): boolean {
    return this.selectedVersion.containerImagesToUpdate
      && Object.keys(this.selectedVersion.containerImagesToUpdate).length > 0;
  }

  onVersionOptionChanged(): void {
    this.selectedVersion = this.versionOptions[this.selectedVersionKey];
    if (!this.selectedVersion.fetched) {
      this.appLoaderService.open();
      this.appService.getUpgradeSummary(this.dialogConfig.appInfo.name, this.selectedVersionKey)
        .pipe(untilDestroyed(this)).subscribe((res: UpgradeSummary) => {
          this.appLoaderService.close();
          this.selectedVersion.changelog = res.changelog;
          this.selectedVersion.containerImagesToUpdate = res.container_images_to_update;
          this.selectedVersion.itemUpdateAvailable = res.item_update_available;
          this.selectedVersion.fetched = true;
        },
        (err) => {
          this.appLoaderService.close();
          this.dialogService.errorReport(err.trace.class, err.reason, err.trace.formatted);
        });
    }
  }

  originalOrder(): number {
    return 0;
  }
}
