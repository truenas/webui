import { KeyValue } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component, Inject,
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { appImagePlaceholder } from 'app/constants/catalog.constants';
import { Role } from 'app/enums/role.enum';
import { helptextApps } from 'app/helptext/apps/apps';
import { AppUpgradeDialogConfig } from 'app/interfaces/app-upgrade-dialog-config.interface';
import { ChartContainerImage } from 'app/interfaces/app.interface';
import { AppUpgradeSummary } from 'app/interfaces/application.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';

type Version = Omit<AppUpgradeSummary, 'upgrade_version' | 'image_update_available' | 'upgrade_human_version'> & { fetched?: boolean };

@UntilDestroy()
@Component({
  selector: 'ix-app-upgrade-dialog',
  styleUrls: ['./app-upgrade-dialog.component.scss'],
  templateUrl: './app-upgrade-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppUpgradeDialogComponent {
  dialogConfig: AppUpgradeDialogConfig;
  imagePlaceholder = appImagePlaceholder;
  helptext = helptextApps;
  versionOptions = new Map<string, Version>();
  selectedVersionKey: string;
  selectedVersion: Version;

  protected readonly requiredRoles = [Role.AppsWrite];

  constructor(
    public dialogRef: MatDialogRef<AppUpgradeDialogComponent>,
    private loader: AppLoaderService,
    private errorHandler: ErrorHandlerService,
    private appService: ApplicationsService,
    public dialogService: DialogService,
    @Inject(MAT_DIALOG_DATA) public data: AppUpgradeDialogConfig,
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
            // TODO: https://ixsystems.atlassian.net/browse/NAS-130379
            // container_images_to_update: null,
            available_versions_for_upgrade: null,
          });
        }
      });
    }

    this.selectedVersionKey = Array.from(this.versionOptions.keys())[0];
    this.selectedVersion = this.versionOptions.get(this.selectedVersionKey);
  }

  // TODO: https://ixsystems.atlassian.net/browse/NAS-130379
  // hasUpdateImages(): boolean {
  //   return this.selectedVersion?.container_images_to_update
  //     && Object.keys(this.selectedVersion.container_images_to_update).length > 0;
  // }

  onVersionOptionChanged(): void {
    this.selectedVersion = this.versionOptions.get(this.selectedVersionKey);
    if (!this.selectedVersion.fetched) {
      this.appService.getChartUpgradeSummary(
        this.dialogConfig.appInfo.name,
        this.selectedVersionKey,
      )
        .pipe(
          this.loader.withLoader(),
          this.errorHandler.catchError(),
          untilDestroyed(this),
        ).subscribe((summary: AppUpgradeSummary) => {
          this.selectedVersion.changelog = summary.changelog;
          // TODO: https://ixsystems.atlassian.net/browse/NAS-130379
          // this.selectedVersion.container_images_to_update = summary.container_images_to_update;
          this.selectedVersion.fetched = true;
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
