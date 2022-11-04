import {
  Component, Output, EventEmitter, OnInit, AfterViewInit, ViewChild, TemplateRef, OnDestroy,
} from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { appImagePlaceholder, ixChartApp, officialCatalog } from 'app/constants/catalog.constants';
import { ChartReleaseStatus } from 'app/enums/chart-release-status.enum';
import helptext from 'app/helptext/apps/apps';
import { ApplicationUserEvent, ApplicationUserEventName, UpgradeSummary } from 'app/interfaces/application.interface';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { CoreBulkResponse } from 'app/interfaces/core-bulk.interface';
import { Job } from 'app/interfaces/job.interface';
import { EmptyConfig, EmptyType } from 'app/modules/entity/entity-empty/entity-empty.component';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { EntityUtils } from 'app/modules/entity/utils';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApplicationTab } from 'app/pages/applications/application-tab.enum';
import { ApplicationsService } from 'app/pages/applications/applications.service';
import {
  ChartRollbackModalComponent,
} from 'app/pages/applications/chart-rollback-modal/chart-rollback-modal.component';
import { ChartEventsDialogComponent } from 'app/pages/applications/dialogs/chart-events/chart-events-dialog.component';
import { ChartUpgradeDialogComponent } from 'app/pages/applications/dialogs/chart-upgrade/chart-upgrade-dialog.component';
import { PodSelectDialogComponent } from 'app/pages/applications/dialogs/pod-select/pod-select-dialog.component';
import { PodSelectDialogType } from 'app/pages/applications/enums/pod-select-dialog.enum';
import { ChartFormComponent } from 'app/pages/applications/forms/chart-form/chart-form.component';
import { ChartUpgradeDialogConfig } from 'app/pages/applications/interfaces/chart-upgrade-dialog-config.interface';
import { RedirectService } from 'app/services';
import { DialogService, WebSocketService } from 'app/services/index';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { LayoutService } from 'app/services/layout.service';
import { ModalService } from 'app/services/modal.service';

@UntilDestroy()
@Component({
  selector: 'ix-charts',
  templateUrl: './chart-releases.component.html',
  styleUrls: ['../applications.component.scss'],
})
export class ChartReleasesComponent implements AfterViewInit, OnInit, OnDestroy {
  @ViewChild('pageHeader') pageHeader: TemplateRef<unknown>;

  @Output() updateTab: EventEmitter<ApplicationUserEvent> = new EventEmitter();

  filteredChartItems: ChartRelease[] = [];
  filterString = '';

  chartItems: Record<string, ChartRelease> = {};
  @Output() switchTab = new EventEmitter<string>();

  private dialogRef: MatDialogRef<EntityJobComponent>;
  imagePlaceholder = appImagePlaceholder;

  readonly officialCatalog = officialCatalog;
  chartsSubscription: Subscription;

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
    private translate: TranslateService,
    public appService: ApplicationsService,
    private modalService: ModalService,
    private slideInService: IxSlideInService,
    protected ws: WebSocketService,
    private redirect: RedirectService,
    private layoutService: LayoutService,
    private snackbar: SnackbarService,
  ) { }

  get isSomethingSelected(): boolean {
    return this.getSelectedItems().length > 0;
  }

  get areAllAppsSelected(): boolean {
    return this.filteredChartItems.every((chart) => chart.selected);
  }

  ngOnInit(): void {
    this.addChartReleaseChangedEventListener();

    this.slideInService.onClose$.pipe(untilDestroyed(this)).subscribe(() => {
      this.refreshChartReleases();
    });
  }

  ngAfterViewInit(): void {
    this.layoutService.pageHeaderUpdater$.next(this.pageHeader);
  }

  onSearch(query: string): void {
    this.filterString = query;
    this.filerChartItems();
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
    return Object.values(this.chartItems);
  }

  addChartReleaseChangedEventListener(): void {
    this.chartsSubscription = this.ws.subscribe('chart.release.query').pipe(untilDestroyed(this)).subscribe((evt) => {
      const app = this.chartItems[evt.id];

      if (app && evt && evt.fields) {
        this.chartItems[evt.id] = { ...app, ...evt.fields };
      }
      this.filerChartItems();
    });
  }

  refreshChartReleases(): void {
    this.chartItems = {};
    this.filteredChartItems = this.getChartItems();
    this.showLoadStatus(EmptyType.Loading);
    this.updateChartReleases();
  }

  ngOnDestroy(): void {
    if (this.chartsSubscription) {
      this.ws.unsubscribe(this.chartsSubscription);
    }
  }

  updateChartReleases(): void {
    this.appService.getKubernetesConfig().pipe(untilDestroyed(this)).subscribe((config) => {
      if (!config.pool) {
        this.chartItems = {};
        this.showLoadStatus(EmptyType.FirstUse);
      } else {
        this.appService.getKubernetesServiceStarted().pipe(untilDestroyed(this)).subscribe((kubernetesStarted) => {
          if (!kubernetesStarted) {
            this.chartItems = {};
            this.showLoadStatus(EmptyType.Errors);
          } else {
            this.appService.getChartReleases().pipe(untilDestroyed(this)).subscribe((charts) => {
              this.chartItems = {};

              charts.forEach((chart) => {
                chart.selected = false;
                this.chartItems[chart.name] = chart;
              });

              this.filerChartItems();
            });
          }
        });
      }
    });
  }

  refreshStatus(name: string): void {
    this.appService.getChartReleases(name).pipe(untilDestroyed(this)).subscribe((releases) => {
      const item = this.chartItems[name];
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
      new EntityUtils().handleWsError(this, error, this.dialogService);
    });
  }

  portalName(name = 'web_portal'): string {
    const humanName = new EntityUtils().snakeToHuman(name);
    return humanName;
  }

  portalLink(chart: ChartRelease, name = 'web_portal'): void {
    this.redirect.openWindow(chart.portals[name][0]);
  }

  update(name: string): void {
    const catalogApp = this.chartItems[name];
    this.appLoaderService.open();
    this.appService.getUpgradeSummary(name).pipe(untilDestroyed(this)).subscribe((summary: UpgradeSummary) => {
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
      dialogRef.afterClosed().pipe(untilDestroyed(this)).subscribe((version) => {
        if (!version) {
          return;
        }

        this.dialogRef = this.mdDialog.open(EntityJobComponent, {
          data: {
            title: helptext.charts.upgrade_dialog.job,
          },
        });
        this.dialogRef.componentInstance.setCall('chart.release.upgrade', [name, { item_version: version }]);
        this.dialogRef.componentInstance.submit();
        this.dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
          this.dialogService.closeAllDialogs();
          this.refreshChartReleases();
        });
        this.dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((error) => {
          this.dialogService.closeAllDialogs();
          new EntityUtils().handleWsError(this, error, this.dialogService);
        });
      });
    });
  }

  onRollback(name: string): void {
    const chartRelease = this.chartItems[name];
    this.mdDialog.open(ChartRollbackModalComponent, {
      data: chartRelease,
    })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((wasRolledBack) => {
        if (!wasRolledBack) {
          return;
        }

        this.refreshChartReleases();
      });
  }

  edit(name: string): void {
    const catalogApp = this.chartItems[name];
    this.appLoaderService.open();
    this.ws.call('chart.release.query', [
      [['id', '=', name]],
      { extra: { include_chart_schema: true } },
    ]).pipe(untilDestroyed(this)).subscribe((releases: ChartRelease[]) => {
      this.appLoaderService.close();
      const form = this.slideInService.open(ChartFormComponent, { wide: true });
      if (catalogApp.chart_metadata.name === ixChartApp) {
        form.setTitle(helptext.launch);
      } else {
        form.setTitle(catalogApp.chart_metadata.name);
      }
      if (releases.length) {
        form.setChartEdit(releases[0]);
      }
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
    const dialogConfirmation = this.dialogService.confirm({
      title: helptext.charts.delete_dialog.title,
      message: this.translate.instant('Delete {name}?', { name }),
      secondaryCheckBox: true,
      secondaryCheckBoxMsg: this.translate.instant('Delete docker images used by the app'),
      data: [{ delete_unused_images: false }],
    });
    let deleteUnusedImages = false;
    dialogConfirmation.componentInstance.switchSelectionEmitter.pipe(
      untilDestroyed(this),
    ).subscribe((checked: boolean) => {
      deleteUnusedImages = checked;
    });
    dialogConfirmation.afterClosed().pipe(
      filter(Boolean),
      untilDestroyed(this),
    )
      .subscribe(() => {
        if (deleteUnusedImages) {
          this.appLoaderService.open();
          this.ws.call(
            'chart.release.get_chart_releases_using_chart_release_images',
            [name],
          ).pipe(untilDestroyed(this)).subscribe((imagesNotTobeDeleted) => {
            this.appLoaderService.close();
            const imageNames = Object.keys(imagesNotTobeDeleted);
            if (imageNames.length > 0) {
              const imageMessage = imageNames.reduce((prev: string, current: string) => {
                const imageNameIndexed = current;
                return prev + '<li>' + imageNameIndexed + '</li>';
              }, '<ul>') + '</ul>';
              this.dialogService.confirm({
                title: this.translate.instant('Images not to be deleted'),
                message: this.translate.instant('These images will not be removed as there are other apps which are consuming them')
              + imageMessage,
                disableClose: true,
                buttonMsg: this.translate.instant('OK'),
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
    this.dialogRef = this.mdDialog.open(EntityJobComponent, {
      data: {
        title: helptext.charts.delete_dialog.job,
      },
    });
    this.dialogRef.componentInstance.setCall('chart.release.delete', [name, { delete_unused_images: deleteUnusedImages }]);
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      this.dialogService.closeAllDialogs();
      this.refreshChartReleases();
    });
  }

  onBulkDelete(): void {
    const checkedItems = this.getSelectedItems();
    const name = checkedItems.join(', ');
    this.dialogService.confirm({
      title: helptext.charts.delete_dialog.title,
      message: this.translate.instant('Delete {name}?', { name }),
    }).pipe(untilDestroyed(this)).subscribe((wasConfirmed) => {
      if (!wasConfirmed) {
        return;
      }

      this.dialogRef = this.mdDialog.open(EntityJobComponent, {
        data: {
          title: helptext.charts.delete_dialog.job,
        },
      });
      this.dialogRef.componentInstance.setCall('core.bulk', ['chart.release.delete', checkedItems.map((item) => [item])]);
      this.dialogRef.componentInstance.submit();
      this.dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(
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
            this.dialogService.errorReport(helptext.bulkActions.title, message);
          }
          this.modalService.closeSlideIn();
          this.refreshChartReleases();
        },
      );
    });
  }

  filerChartItems(): void {
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
      width: '50vw',
      minWidth: '650px',
      maxWidth: '850px',
      data: { appName: name, type: PodSelectDialogType.Shell },
    });
  }

  openLogs(name: string): void {
    this.mdDialog.open(PodSelectDialogComponent, {
      width: '50vw',
      minWidth: '650px',
      maxWidth: '850px',
      data: { appName: name, type: PodSelectDialogType.Logs },
    });
  }

  showChartEvents(name: string): void {
    const catalogApp = this.chartItems[name];
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
