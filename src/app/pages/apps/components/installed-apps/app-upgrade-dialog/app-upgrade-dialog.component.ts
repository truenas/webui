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
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { ApplicationsService } from 'app/pages/apps-old/applications.service';
import { ChartUpgradeDialogConfig } from 'app/pages/apps-old/interfaces/chart-upgrade-dialog-config.interface';
import { DialogService } from 'app/services';
import { ErrorHandlerService } from 'app/services/error-handler.service';

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
    private errorHandler: ErrorHandlerService,
    private appService: ApplicationsService,
    public dialogService: DialogService,
    @Inject(MAT_DIALOG_DATA) public data: ChartUpgradeDialogConfig,
  ) {}

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
          error: (error: WebsocketError) => {
            this.appLoaderService.close();
            this.dialogService.error(this.errorHandler.parseWsError(error));
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
