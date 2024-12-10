import { KeyValue, KeyValuePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component, Inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogContent } from '@angular/material/dialog';
import {
  MatAccordion, MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle,
} from '@angular/material/expansion';
import { MatFormField } from '@angular/material/form-field';
import { MatOption, MatSelect } from '@angular/material/select';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { ImgFallbackModule } from 'ngx-img-fallback';
import { appImagePlaceholder } from 'app/constants/catalog.constants';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { helptextApps } from 'app/helptext/apps/apps';
import { AppUpgradeDialogConfig } from 'app/interfaces/app-upgrade-dialog-config.interface';
import { ChartContainerImage } from 'app/interfaces/app.interface';
import { AppUpgradeSummary } from 'app/interfaces/application.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';

type Version = Omit<AppUpgradeSummary, 'upgrade_version' | 'image_update_available' | 'upgrade_human_version'> & { fetched?: boolean };

@UntilDestroy()
@Component({
  selector: 'ix-app-upgrade-dialog',
  styleUrls: ['./app-upgrade-dialog.component.scss'],
  templateUrl: './app-upgrade-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
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
    MatAccordion,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    FormActionsComponent,
    MatButton,
    RequiresRolesDirective,
  ],
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
    if (!this.selectedVersion.fetched) {
      this.appService.getAppUpgradeSummary(
        this.dialogConfig.appInfo.name,
        this.selectedVersionKey,
      )
        .pipe(
          this.loader.withLoader(),
          this.errorHandler.catchError(),
          untilDestroyed(this),
        ).subscribe((summary: AppUpgradeSummary) => {
          this.selectedVersion.changelog = summary.changelog;
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
