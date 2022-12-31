import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { chartsTrain, ixChartApp, officialCatalog } from 'app/constants/catalog.constants';
import helptext from 'app/helptext/apps/apps';
import { CatalogApp } from 'app/interfaces/catalog.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { EntityUtils } from 'app/modules/entity/utils';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApplicationsService } from 'app/pages/applications/applications.service';
import { ChartFormComponent } from 'app/pages/applications/forms/chart-form/chart-form.component';
import { KubernetesSettingsComponent } from 'app/pages/applications/kubernetes-settings/kubernetes-settings.component';
import { SelectPoolDialogComponent } from 'app/pages/applications/select-pool-dialog/select-pool-dialog.component';
import { AppLoaderService, DialogService } from 'app/services';
import { CoreService } from 'app/services/core-service/core.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  selector: 'ix-common-apps-toolbar-buttons',
  templateUrl: './common-apps-toolbar-buttons.component.html',
  styleUrls: ['./common-apps-toolbar-buttons.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonAppsToolbarButtonsComponent implements OnInit {
  wasPoolSet = false;

  constructor(
    private loader: AppLoaderService,
    private appService: ApplicationsService,
    private slideInService: IxSlideInService,
    private dialogService: DialogService,
    private matDialog: MatDialog,
    private translate: TranslateService,
    private core: CoreService,
    private cdr: ChangeDetectorRef,
    private snackbar: SnackbarService,
  ) { }

  ngOnInit(): void {
    this.loadIfPoolSet();
  }

  onChoosePool(): void {
    const dialog = this.matDialog.open(SelectPoolDialogComponent);
    dialog.afterClosed().pipe(untilDestroyed(this)).subscribe(() => {
      this.core.emit({ name: 'RefreshAppsTab' });
      this.loadIfPoolSet();
    });
  }

  onAdvancedSettings(): void {
    this.slideInService.open(KubernetesSettingsComponent);
  }

  onUnsetPool(): void {
    this.dialogService.confirm({
      title: helptext.choosePool.unsetPool.confirm.title,
      message: helptext.choosePool.unsetPool.confirm.message,
      hideCheckBox: true,
      buttonMsg: helptext.choosePool.unsetPool.confirm.button,
    }).pipe(untilDestroyed(this)).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      const dialogRef = this.matDialog.open(EntityJobComponent, {
        data: {
          title: helptext.choosePool.jobTitle,
        },
        disableClose: true,
      });
      dialogRef.componentInstance.setCall('kubernetes.update', [{ pool: null }]);
      dialogRef.componentInstance.submit();
      dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
        dialogRef.close();
        this.core.emit({ name: 'RefreshAppsTab' });
        this.loadIfPoolSet();
        this.snackbar.success(
          this.translate.instant('Pool has been unset.'),
        );
      });

      dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((err) => {
        new EntityUtils().handleWsError(this, err, this.dialogService);
      });
    });
  }

  onLaunchDockerImage(): void {
    this.loader.open();
    this.appService.getCatalogItem(ixChartApp, officialCatalog, chartsTrain)
      .pipe(untilDestroyed(this))
      .subscribe((catalogApp) => {
        this.loader.close();

        const catalogAppInfo = {
          ...catalogApp,
          catalog: {
            id: officialCatalog,
            train: chartsTrain,
          },
          schema: catalogApp.versions[catalogApp.latest_version].schema,
        } as CatalogApp;
        const chartWizard = this.slideInService.open(ChartFormComponent, { wide: true });
        chartWizard.setChartCreate(catalogAppInfo);
      });
  }

  private loadIfPoolSet(): void {
    this.appService.getKubernetesConfig().pipe(untilDestroyed(this)).subscribe((config) => {
      this.wasPoolSet = Boolean(config.pool);
      this.cdr.markForCheck();
    });
  }
}
