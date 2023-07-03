import {
  Component, Output, EventEmitter, OnInit, AfterViewInit, ViewChild, TemplateRef,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { startCase } from 'lodash';
import { of } from 'rxjs';
import { catchError, filter } from 'rxjs/operators';
import { appImagePlaceholder, ixChartApp, officialCatalog } from 'app/constants/catalog.constants';
import { ChartReleaseStatus } from 'app/enums/chart-release-status.enum';
import { EmptyType } from 'app/enums/empty-type.enum';
import helptext from 'app/helptext/apps/apps';
import { ApplicationUserEvent, ApplicationUserEventName, UpgradeSummary } from 'app/interfaces/application.interface';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { CoreBulkResponse } from 'app/interfaces/core-bulk.interface';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { Job } from 'app/interfaces/job.interface';
import { PodDialogFormValue } from 'app/interfaces/pod-select-dialog.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApplicationTab } from 'app/pages/apps-old/application-tab.enum';
import { ApplicationsService } from 'app/pages/apps-old/applications.service';
import {
  ChartRollbackModalComponent,
} from 'app/pages/apps-old/chart-rollback-modal/chart-rollback-modal.component';
import { ChartBulkUpgradeComponent } from 'app/pages/apps-old/dialogs/chart-bulk-upgrade/chart-bulk-upgrade.component';
import { ChartEventsDialogComponent } from 'app/pages/apps-old/dialogs/chart-events/chart-events-dialog.component';
import { ChartUpgradeDialogComponent } from 'app/pages/apps-old/dialogs/chart-upgrade/chart-upgrade-dialog.component';
import { PodSelectDialogComponent } from 'app/pages/apps-old/dialogs/pod-select/pod-select-dialog.component';
import { PodSelectDialogType } from 'app/pages/apps-old/enums/pod-select-dialog.enum';
import { ChartFormComponent } from 'app/pages/apps-old/forms/chart-form/chart-form.component';
import { ChartUpgradeDialogConfig } from 'app/pages/apps-old/interfaces/chart-upgrade-dialog-config.interface';
import { RedirectService, DialogService } from 'app/services';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { LayoutService } from 'app/services/layout.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-charts',
  templateUrl: './chart-releases.component.html',
  styleUrls: ['../applications.component.scss'],
})
export class ChartReleasesComponent implements AfterViewInit, OnInit {
  @ViewChild('pageHeader') pageHeader: TemplateRef<unknown>;

  @Output() updateTab = new EventEmitter<ApplicationUserEvent>();
  @Output() switchTab = new EventEmitter<string>();

  filteredChartItems: ChartRelease[] = [];
  filterString = '';

  chartItems = new Map<string, ChartRelease>();

  readonly imagePlaceholder = appImagePlaceholder;
  readonly officialCatalog = officialCatalog;

  emptyPageConf: EmptyConfig = {
    type: EmptyType.Loading,
    large: true,
    title: helptext.message.loading,
    button: {
      label: this.translate.instant('View Catalog'),
      action: this.viewCatalog.bind(this),
    },
  };

  readonly ChartReleaseStatus = ChartReleaseStatus;
  readonly isEmpty = _.isEmpty;

  constructor(
    private mdDialog: MatDialog,
    private appLoaderService: AppLoaderService,
    private dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
    private translate: TranslateService,
    public appService: ApplicationsService,
    private slideInService: IxSlideInService,
    protected ws: WebSocketService,
    private redirect: RedirectService,
    private layoutService: LayoutService,
    private snackbar: SnackbarService,
    private router: Router,
  ) { }

  get isSomethingSelected(): boolean {
    return this.getSelectedItems().length > 0;
  }

  get areAllAppsSelected(): boolean {
    return this.filteredChartItems.every((chart) => chart.selected);
  }

  get hasUpdates(): boolean {
    if (this.filteredChartItems.length === 0) {
      return false;
    }

    return this.getSelectedItems()
      .map((name) => this.chartItems.get(name))
      .some((app) => app.update_available || app.container_images_update_available);
  }

  ngOnInit(): void {
    this.addChartReleaseChangedEventListener();
  }

  ngAfterViewInit(): void {
    this.layoutService.pageHeaderUpdater$.next(this.pageHeader);
  }

  onSearch(query: string): void {
    this.filterString = query;
    this.filterChartItems();
  }

  onSelectAll(): void {
    this.filteredChartItems.forEach((item) => {
      item.selected = true;
    });
  }

  onUnselectAll(): void {
    this.filteredChartItems.forEach((item) => {
      item.selected = false;
    });
  }

  onBulkStart(): void {
    const checkedItems = this.getSelectedItems();
    checkedItems.forEach((name) => this.start(name));
    this.snackbar.success(this.translate.instant(helptext.bulkActions.finished));
  }

  onBulkStop(): void {
    const checkedItems = this.getSelectedItems();
    checkedItems.forEach((name) => this.stop(name));
    this.snackbar.success(this.translate.instant(helptext.bulkActions.finished));
  }

  viewCatalog(): void {
    this.updateTab.emit({ name: ApplicationUserEventName.SwitchTab, value: ApplicationTab.AvailableApps });
  }

  showLoadStatus(type: EmptyType): void {
    let title = '';
    let message;

    switch (type) {
      case EmptyType.Loading:
        title = helptext.message.loading;
        break;
      case EmptyType.FirstUse:
        title = helptext.message.not_configured;
        break;
      case EmptyType.NoSearchResults:
        title = helptext.message.no_search_result;
        break;
      case EmptyType.NoPageData:
        title = helptext.message.no_installed;
        message = helptext.message.no_installed_message;
        break;
      case EmptyType.Errors:
        title = helptext.message.not_running;
        break;
    }

    this.emptyPageConf.type = type;
    this.emptyPageConf.title = title;
    this.emptyPageConf.message = message;
  }

  getChartItems(): ChartRelease[] {
    return Array.from(this.chartItems.values());
  }

  addChartReleaseChangedEventListener(): void {
    this.ws.subscribe('chart.release.query').pipe(
      untilDestroyed(this),
    ).subscribe((evt) => {
      const app = this.chartItems.get(evt.fields?.name);

      if (app && evt?.fields) {
        this.chartItems.set(evt.fields?.name, { ...app, ...evt.fields });
      }
      this.filterChartItems();
    });
  }

  refreshChartReleases(): void {
    this.chartItems.clear();
    this.filteredChartItems = this.getChartItems();
    this.showLoadStatus(EmptyType.Loading);
    this.updateChartReleases();
  }

  updateChartReleases(): void {
    this.appService.getKubernetesConfig().pipe(untilDestroyed(this)).subscribe((config) => {
      if (!config.pool) {
        this.chartItems.clear();
        this.showLoadStatus(EmptyType.FirstUse);
      } else {
        this.appService.getKubernetesServiceStarted().pipe(untilDestroyed(this)).subscribe((kubernetesStarted) => {
          if (!kubernetesStarted) {
            this.chartItems.clear();
            this.showLoadStatus(EmptyType.Errors);
          } else {
            this.appService.getChartReleases().pipe(
              catchError(() => of(this.showLoadStatus(EmptyType.Errors))),
              untilDestroyed(this),
            ).subscribe((charts) => {
              if (!charts) {
                this.showLoadStatus(EmptyType.Errors);
                return;
              }

              this.chartItems.clear();

              charts.forEach((chart) => {
                chart.selected = false;
                this.chartItems.set(chart.name, chart);
              });

              this.filterChartItems();
            });
          }
        });
      }
    });
  }

  refreshStatus(name: string): void {
    this.appService.getChartReleases(name).pipe(untilDestroyed(this)).subscribe((releases) => {
      const item = this.chartItems.get(name);
      if (item) {
        item.status = releases[0].status;
        if (item.status === ChartReleaseStatus.Deploying) {
          setTimeout(() => {
            this.refreshStatus(name);
          }, 3000);
        }
      }
    });
  }

  start(name: string): void {
    this.changeReplicaCountJob(name, helptext.starting, 1);
  }

  stop(name: string): void {
    this.changeReplicaCountJob(name, helptext.stopping, 0);
  }

  changeReplicaCountJob(chartName: string, title: string, newReplicaCount: number): void {
    const dialogRef = this.mdDialog.open(EntityJobComponent, {
      data: { title },
    });
    dialogRef.componentInstance.setCall('chart.release.scale', [chartName, { replica_count: newReplicaCount }]);
    dialogRef.componentInstance.submit();
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      this.dialogService.closeAllDialogs();
      this.refreshStatus(chartName);
    });
    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((error) => {
      this.dialogService.error(this.errorHandler.parseJobError(error));
    });
  }

  portalName(name = 'web_portal'): string {
    return startCase(name);
  }

  portalLink(chart: ChartRelease, name = 'web_portal'): void {
    this.redirect.openWindow(chart.portals[name][0]);
  }

  update(name: string): void {
    const catalogApp = this.chartItems.get(name);
    this.appLoaderService.open();
    this.appService.getUpgradeSummary(name).pipe(untilDestroyed(this)).subscribe({
      next: (summary: UpgradeSummary) => {
        this.appLoaderService.close();

        const dialogRef = this.mdDialog.open(ChartUpgradeDialogComponent, {
          width: '50vw',
          minWidth: '500px',
          maxWidth: '750px',
          data: {
            appInfo: catalogApp,
            upgradeSummary: summary,
          } as ChartUpgradeDialogConfig,
        });
        dialogRef.afterClosed().pipe(filter(Boolean), untilDestroyed(this)).subscribe((version: string) => {
          const jobDialogRef = this.mdDialog.open(EntityJobComponent, {
            data: {
              title: helptext.charts.upgrade_dialog.job,
            },
          });
          jobDialogRef.componentInstance.setCall('chart.release.upgrade', [name, { item_version: version }]);
          jobDialogRef.componentInstance.submit();
          jobDialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
            this.dialogService.closeAllDialogs();
            this.refreshChartReleases();
          });
          jobDialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((error) => {
            this.dialogService.closeAllDialogs();
            this.dialogService.error(this.errorHandler.parseJobError(error));
          });
        });
      },
      error: (error: WebsocketError) => {
        this.appLoaderService.close();
        this.dialogService.error(this.errorHandler.parseWsError(error));
      },
    });
  }

  onRollback(name: string): void {
    const chartRelease = this.chartItems.get(name);
    this.mdDialog
      .open(ChartRollbackModalComponent, { data: chartRelease })
      .afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => {
        this.refreshChartReleases();
      });
  }

  edit(name: string): void {
    const catalogApp = this.chartItems.get(name);
    this.appLoaderService.open();
    this.ws.call('chart.release.query', [
      [['id', '=', name]],
      { extra: { include_chart_schema: true } },
    ]).pipe(untilDestroyed(this)).subscribe((releases: ChartRelease[]) => {
      this.appLoaderService.close();

      let slideInRef: IxSlideInRef<ChartFormComponent>;
      if (catalogApp.chart_metadata.name === ixChartApp) {
        slideInRef = this.slideInService.open(
          ChartFormComponent,
          { wide: true, data: { title: helptext.launch, releases } },
        );
      } else {
        slideInRef = this.slideInService.open(
          ChartFormComponent,
          { wide: true, data: { title: catalogApp.chart_metadata.name, releases } },
        );
      }

      slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
        this.refreshChartReleases();
      });
    });
  }

  getSelectedItems(): string[] {
    const selectedItems: string[] = [];
    this.filteredChartItems.forEach((element) => {
      if (element.selected) {
        selectedItems.push(element.name);
      }
    });
    return selectedItems;
  }

  delete(name: string): void {
    this.dialogService.confirm({
      title: helptext.charts.delete_dialog.title,
      message: this.translate.instant('Delete {name}?', { name }),
      secondaryCheckbox: true,
      secondaryCheckboxText: this.translate.instant('Delete docker images used by the app'),
    })
      .pipe(untilDestroyed(this))
      .subscribe((result) => {
        if (!result.confirmed) {
          return;
        }

        const deleteUnusedImages = result.secondaryCheckbox;
        if (result.secondaryCheckbox) {
          this.appLoaderService.open();
          this.ws.call(
            'chart.release.get_chart_releases_using_chart_release_images',
            [name],
          ).pipe(untilDestroyed(this)).subscribe((imagesNotTobeDeleted) => {
            this.appLoaderService.close();
            const imageNames = Object.keys(imagesNotTobeDeleted);
            if (imageNames.length > 0) {
              const imageMessage = imageNames.reduce((prev: string, current: string) => {
                return prev + '<li>' + current + '</li>';
              }, '<ul>') + '</ul>';
              this.dialogService.confirm({
                title: this.translate.instant('Images not to be deleted'),
                message: this.translate.instant('These images will not be removed as there are other apps which are consuming them')
              + imageMessage,
                disableClose: true,
                buttonText: this.translate.instant('OK'),
              }).pipe(filter(Boolean), untilDestroyed(this))
                .subscribe(() => {
                  this.executeDelete(name, deleteUnusedImages);
                });
            } else {
              this.executeDelete(name, deleteUnusedImages);
            }
          });
        } else {
          this.executeDelete(name, deleteUnusedImages);
        }
      });
  }

  executeDelete(name: string, deleteUnusedImages: boolean): void {
    const dialogRef = this.mdDialog.open(EntityJobComponent, {
      data: {
        title: helptext.charts.delete_dialog.job,
      },
    });
    dialogRef.componentInstance.setCall('chart.release.delete', [name, { delete_unused_images: deleteUnusedImages }]);
    dialogRef.componentInstance.submit();
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      this.dialogService.closeAllDialogs();
      this.refreshChartReleases();
    });
  }

  onBulkUpgrade(): void {
    const selectedAppsNames = this.getSelectedItems();
    const apps = selectedAppsNames.map((name) => this.chartItems.get(name));
    const dialogRef = this.mdDialog.open(ChartBulkUpgradeComponent, { data: apps });

    dialogRef.afterClosed().pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.refreshChartReleases();
    });
  }

  onBulkDelete(): void {
    const checkedItems = this.getSelectedItems();
    const name = checkedItems.join(', ');
    this.dialogService.confirm({
      title: helptext.charts.delete_dialog.title,
      message: this.translate.instant('Delete {name}?', { name }),
    }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      const dialogRef = this.mdDialog.open(EntityJobComponent, {
        data: {
          title: helptext.charts.delete_dialog.job,
        },
      });
      dialogRef.componentInstance.setCall('core.bulk', ['chart.release.delete', checkedItems.map((item) => [item])]);
      dialogRef.componentInstance.submit();
      dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(
        (job: Job<CoreBulkResponse[]>) => {
          this.dialogService.closeAllDialogs();
          let message = '';
          job.result.forEach((item) => {
            if (item.error !== null) {
              message = message + '<li>' + item.error + '</li>';
            }
          });

          if (message !== '') {
            message = '<ul>' + message + '</ul>';
            this.dialogService.error({ title: helptext.bulkActions.title, message });
          }
          this.refreshChartReleases();
        },
      );
    });
  }

  filterChartItems(): void {
    if (this.filterString) {
      this.filteredChartItems = this.getChartItems().filter((chart) => {
        return chart.name.toLowerCase().includes(this.filterString.toLocaleLowerCase());
      });
    } else {
      this.filteredChartItems = this.getChartItems();
    }

    if (this.filteredChartItems.length === 0) {
      if (this.filterString) {
        this.showLoadStatus(EmptyType.NoSearchResults);
      } else {
        this.showLoadStatus(EmptyType.NoPageData);
      }
    }
  }

  openShell(name: string): void {
    this.mdDialog.open(PodSelectDialogComponent, {
      minWidth: '650px',
      maxWidth: '850px',
      data: {
        appName: name,
        title: 'Choose pod',
        type: PodSelectDialogType.Shell,
        customSubmit: (values: PodDialogFormValue, appName: string) => this.shellDialogSubmit(values, appName),
      },
    });
  }

  openLogs(name: string): void {
    this.mdDialog.open(PodSelectDialogComponent, {
      minWidth: '650px',
      maxWidth: '850px',
      data: {
        appName: name,
        title: 'Choose pod',
        type: PodSelectDialogType.Logs,
        customSubmit: (formValueDialog: PodDialogFormValue, appName: string) => {
          this.logDialogSubmit(formValueDialog, appName);
        },
      },
    });
  }

  shellDialogSubmit(formValue: PodDialogFormValue, appName: string): void {
    this.router.navigate(['/apps-old/1/shell/', appName, formValue.pods, formValue.command]);
  }

  logDialogSubmit(formValue: PodDialogFormValue, appName: string): void {
    const tailLines = formValue.tail_lines.toString();
    this.router.navigate(['/apps-old/1/logs/', appName, formValue.pods, formValue.containers, tailLines]);
  }

  showChartEvents(name: string): void {
    const catalogApp = this.chartItems.get(name);
    if (catalogApp) {
      this.mdDialog.open(ChartEventsDialogComponent, {
        width: '50vw',
        minWidth: '650px',
        maxWidth: '850px',
        data: catalogApp,
      });
    }
  }
}
