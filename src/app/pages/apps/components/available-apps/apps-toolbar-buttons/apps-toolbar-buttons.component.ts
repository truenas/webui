import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { ixChartApp } from 'app/constants/catalog.constants';
import helptext from 'app/helptext/apps/apps';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApplicationsService } from 'app/pages/apps-old/applications.service';
import { KubernetesSettingsComponent } from 'app/pages/apps-old/kubernetes-settings/kubernetes-settings.component';
import { SelectPoolDialogComponent } from 'app/pages/apps-old/select-pool-dialog/select-pool-dialog.component';
import { DialogService } from 'app/services';
import { CoreService } from 'app/services/core-service/core.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  selector: 'ix-apps-toolbar-buttons',
  templateUrl: './apps-toolbar-buttons.component.html',
  styleUrls: ['./apps-toolbar-buttons.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppsToolbarButtonsComponent implements OnInit {
  wasPoolSet = false;
  readonly customIxChartApp = ixChartApp;

  constructor(
    private appService: ApplicationsService,
    private slideInService: IxSlideInService,
    private dialogService: DialogService,
    private matDialog: MatDialog,
    private translate: TranslateService,
    private core: CoreService,
    private cdr: ChangeDetectorRef,
    private snackbar: SnackbarService,
    private errorHandler: ErrorHandlerService,
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
      hideCheckbox: true,
      buttonText: helptext.choosePool.unsetPool.confirm.button,
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
        this.dialogService.error(this.errorHandler.parseJobError(err));
      });
    });
  }

  private loadIfPoolSet(): void {
    this.appService.getKubernetesConfig().pipe(untilDestroyed(this)).subscribe((config) => {
      this.wasPoolSet = Boolean(config.pool);
      this.cdr.markForCheck();
    });
  }
}
