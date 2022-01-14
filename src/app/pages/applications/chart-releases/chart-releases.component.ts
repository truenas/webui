import {
  Component, Output, EventEmitter, OnInit,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogRef } from '@angular/material/dialog/dialog-ref';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { filter } from 'rxjs/operators';
import { appImagePlaceholder, ixChartApp, officialCatalog } from 'app/constants/catalog.constants';
import { CommonUtils } from 'app/core/classes/common-utils';
import { CoreService } from 'app/core/services/core-service/core.service';
import { ChartReleaseStatus } from 'app/enums/chart-release-status.enum';
import helptext from 'app/helptext/apps/apps';
import { ApplicationUserEventName, UpgradeSummary } from 'app/interfaces/application.interface';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { CoreBulkResponse } from 'app/interfaces/core-bulk.interface';
import { CoreEvent } from 'app/interfaces/events';
import { Job } from 'app/interfaces/job.interface';
import { ApplicationTab } from 'app/pages/applications/application-tab.enum';
import { ApplicationToolbarControl } from 'app/pages/applications/application-toolbar-control.enum';
import { ChartUpgradeDialogComponent } from 'app/pages/applications/dialogs/chart-upgrade/chart-upgrade-dialog.component';
import { ChartUpgradeDialogConfig } from 'app/pages/applications/interfaces/chart-upgrade-dialog-config.interface';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/pages/common/entity/entity-dialog/entity-dialog.component';
import { EmptyConfig, EmptyType } from 'app/pages/common/entity/entity-empty/entity-empty.component';
import { FormSelectConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { EntityJobComponent } from 'app/pages/common/entity/entity-job/entity-job.component';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { DialogService, SystemGeneralService, WebSocketService } from 'app/services/index';
import { ModalService } from 'app/services/modal.service';
import { ApplicationsService } from '../applications.service';
import { ChartEventsDialogComponent } from '../dialogs/chart-events/chart-events-dialog.component';
import { ChartFormComponent } from '../forms/chart-form.component';

@UntilDestroy()
@Component({
  selector: 'app-charts',
  templateUrl: './chart-releases.component.html',
  styleUrls: ['../applications.component.scss'],
})

export class ChartReleasesComponent implements OnInit {
  @Output() updateTab = new EventEmitter();

  filteredChartItems: ChartRelease[] = [];
  filterString = '';

  chartItems: Record<string, ChartRelease> = {};
  @Output() switchTab = new EventEmitter<string>();

  private dialogRef: MatDialogRef<EntityJobComponent>;
  ixIcon = 'assets/images/ix-original.png';
  private rollbackChartName: string;

  protected utils: CommonUtils;

  private selectedAppName: string;
  private podList: string[] = [];
  private podDetails: Record<string, string[]> = {};
  imagePlaceholder = appImagePlaceholder;

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

  rollBackChart: DialogFormConfiguration = {
    title: helptext.charts.rollback_dialog.title,
    fieldConfig: [{
      type: 'select',
      name: 'item_version',
      placeholder: helptext.charts.rollback_dialog.version.placeholder,
      tooltip: helptext.charts.rollback_dialog.version.tooltip,
      required: true,
    }, {
      type: 'checkbox',
      name: 'rollback_snapshot',
      placeholder: helptext.charts.rollback_dialog.snapshot.placeholder,
      tooltip: helptext.charts.rollback_dialog.snapshot.tooltip,
    }],
    method_ws: 'chart.release.rollback',
    saveButtonText: helptext.charts.rollback_dialog.action,
    customSubmit: (entityDialog) => this.doRollback(entityDialog),
  };

  choosePod: DialogFormConfiguration = {
    title: helptext.podConsole.choosePod.title,
    fieldConfig: [{
      type: 'select',
      name: 'pods',
      placeholder: helptext.podConsole.choosePod.placeholder,
      required: true,
    }, {
      type: 'select',
      name: 'containers',
      placeholder: helptext.podConsole.chooseConatiner.placeholder,
      required: true,
    }, {
      type: 'input',
      name: 'command',
      placeholder: helptext.podConsole.chooseCommand.placeholder,
      value: '/bin/sh',
    }],
    saveButtonText: helptext.podConsole.choosePod.action,
    customSubmit: (entityDialog) => this.doPodSelect(entityDialog),
    afterInit: (entityDialog) => this.afterShellDialogInit(entityDialog),
  };

  choosePodForLogs: DialogFormConfiguration = {
    title: helptext.podLogs.title,
    fieldConfig: [{
      type: 'select',
      name: 'pods',
      placeholder: helptext.podLogs.choosePod.placeholder,
      required: true,
    }, {
      type: 'select',
      name: 'containers',
      placeholder: helptext.podLogs.chooseConatiner.placeholder,
      required: true,
    }, {
      type: 'input',
      name: 'tail_lines',
      placeholder: helptext.podLogs.tailLines.placeholder,
      value: 500,
      required: true,
    }],
    saveButtonText: helptext.podConsole.choosePod.action,
    customSubmit: (entityDialog) => this.doPodSelectForLogs(entityDialog),
    afterInit: (entityDialog) => this.afterLogsDialogInit(entityDialog),
  };

  readonly ChartReleaseStatus = ChartReleaseStatus;
  readonly isEmpty = _.isEmpty;

  constructor(private mdDialog: MatDialog, private appLoaderService: AppLoaderService,
    private dialogService: DialogService, private translate: TranslateService,
    public appService: ApplicationsService, private modalService: ModalService,
    private sysGeneralService: SystemGeneralService, private router: Router,
    private core: CoreService, protected ws: WebSocketService) { }

  ngOnInit(): void {
    this.utils = new CommonUtils();
    this.addChartReleaseChangedEventListner();
  }

  onToolbarAction(evt: CoreEvent): void {
    if (evt.data.event_control === ApplicationToolbarControl.Filter) {
      this.filterString = evt.data.filter;
      this.filerChartItems();
    } else if (evt.data.event_control === ApplicationToolbarControl.Bulk) {
      this.onBulkAction(evt.data.bulk.value);
    }
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

  addChartReleaseChangedEventListner(): void {
    this.ws.subscribe('chart.release.query').pipe(untilDestroyed(this)).subscribe((evt) => {
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

  updateChartReleases(): void {
    this.appService.getKubernetesConfig().pipe(untilDestroyed(this)).subscribe((res) => {
      if (!res.pool) {
        this.chartItems = {};
        this.showLoadStatus(EmptyType.FirstUse);
      } else {
        this.appService.getKubernetesServiceStarted().pipe(untilDestroyed(this)).subscribe((res) => {
          if (!res) {
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

  portalName(name: string = 'web_portal'): string {
    const humanName = new EntityUtils().snakeToHuman(name);
    return humanName;
  }

  portalLink(chart: ChartRelease, name: string = 'web_portal'): void {
    window.open(chart.portals[name][0]);
  }

  update(name: string): void {
    const catalogApp = this.chartItems[name];
    this.appLoaderService.open();
    this.appService.getUpgradeSummary(name).pipe(untilDestroyed(this)).subscribe((res: UpgradeSummary) => {
      this.appLoaderService.close();

      const dialogRef = this.mdDialog.open(ChartUpgradeDialogComponent, {
        width: '50vw',
        minWidth: '500px',
        maxWidth: '750px',
        data: {
          appInfo: catalogApp,
          upgradeSummary: res,
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

  rollback(name: string): void {
    this.rollbackChartName = name;
    this.dialogService.dialogForm(this.rollBackChart, true);
    const rollBackList = Object.keys(this.chartItems[this.rollbackChartName].history);
    const rollBackConfig = this.rollBackChart.fieldConfig[0] as FormSelectConfig;
    rollBackConfig.value = rollBackList[0];
    rollBackConfig.options = rollBackList.map((item) => ({
      label: item,
      value: item,
    }));
  }

  doRollback(entityDialog: EntityDialogComponent): void {
    const form = entityDialog.formGroup.controls;
    const payload = {
      item_version: form['item_version'].value,
      rollback_snapshot: form['rollback_snapshot'].value,
    };
    this.dialogRef = this.mdDialog.open(EntityJobComponent, {
      data: {
        title: helptext.charts.rollback_dialog.job,
      },
    });
    this.dialogRef.componentInstance.setCall('chart.release.rollback', [this.rollbackChartName, payload]);
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      this.dialogService.closeAllDialogs();
      this.refreshChartReleases();
    });
    this.dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((error) => {
      this.dialogService.closeAllDialogs();
      new EntityUtils().handleWsError(this, error, this.dialogService);
    });
  }

  edit(name: string): void {
    const catalogApp = this.chartItems[name];
    const chartFormComponent = this.modalService.openInSlideIn(ChartFormComponent, name);
    if (catalogApp.chart_metadata.name == ixChartApp) {
      chartFormComponent.setTitle(helptext.launch);
    } else {
      chartFormComponent.setTitle(catalogApp.chart_metadata.name);
    }
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

  checkAll(checkedItems: string[]): void {
    let selectAll = true;
    if (checkedItems.length == this.filteredChartItems.length) {
      selectAll = false;
    }

    this.filteredChartItems.forEach((item) => {
      item.selected = selectAll;
    });

    this.refreshToolbarMenus();
  }

  onBulkAction(actionName: string): void {
    const checkedItems = this.getSelectedItems();

    if (actionName === 'select_all') {
      this.checkAll(checkedItems);
    } else if (checkedItems.length > 0) {
      if (actionName === 'delete') {
        this.bulkDelete(checkedItems);
      } else {
        checkedItems.forEach((name) => {
          switch (actionName) {
            case 'start':
              this.start(name);
              break;
            case 'stop':
              this.stop(name);
              break;
          }
        });

        this.dialogService.info(helptext.bulkActions.success, this.translate.instant(helptext.bulkActions.finished), '500px', 'info', true);
      }
    } else {
      this.dialogService.errorReport(
        helptext.bulkActions.error,
        this.translate.instant(helptext.bulkActions.no_selected),
      );
    }
  }

  delete(name: string): void {
    this.dialogService.confirm({
      title: helptext.charts.delete_dialog.title,
      message: this.translate.instant('Delete {name}?', { name }),
    }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.dialogRef = this.mdDialog.open(EntityJobComponent, {
        data: {
          title: helptext.charts.delete_dialog.job,
        },
      });
      this.dialogRef.componentInstance.setCall('chart.release.delete', [name]);
      this.dialogRef.componentInstance.submit();
      this.dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
        this.dialogService.closeAllDialogs();
        this.refreshChartReleases();
      });
    });
  }

  bulkDelete(names: string[]): void {
    const name = names.join(', ');
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
      this.dialogRef.componentInstance.setCall('core.bulk', ['chart.release.delete', names.map((item) => [item])]);
      this.dialogRef.componentInstance.submit();
      this.dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(
        (res: Job<CoreBulkResponse[]>) => {
          this.dialogService.closeAllDialogs();
          let message = '';
          res.result.forEach((item) => {
            if (item.error != null) {
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

    if (this.filteredChartItems.length == 0) {
      if (this.filterString) {
        this.showLoadStatus(EmptyType.NoSearchResults);
      } else {
        this.showLoadStatus(EmptyType.NoPageData);
      }
    }

    this.refreshToolbarMenus();
  }

  openShell(name: string): void {
    this.podList = [];
    this.podDetails = {};
    this.selectedAppName = name;
    this.appLoaderService.open();
    this.ws.call('chart.release.pod_console_choices', [this.selectedAppName]).pipe(untilDestroyed(this)).subscribe((res) => {
      this.appLoaderService.close();
      this.podDetails = { ...res };
      this.podList = Object.keys(this.podDetails);
      if (this.podList.length == 0) {
        this.dialogService.confirm({
          title: helptext.podConsole.nopod.title,
          message: helptext.podConsole.nopod.message,
          hideCheckBox: true,
          buttonMsg: this.translate.instant('Close'),
          hideCancel: true,
        });
      } else {
        // Pods
        const podsConfig = this.choosePod.fieldConfig[0] as FormSelectConfig;
        podsConfig.value = this.podList[0];
        podsConfig.options = this.podList.map((item) => ({
          label: item,
          value: item,
        }));
        // Containers
        const containerConfig = this.choosePod.fieldConfig[1] as FormSelectConfig;
        containerConfig.value = this.podDetails[this.podList[0]][0];
        containerConfig.options = this.podDetails[this.podList[0]].map((item) => ({
          label: item,
          value: item,
        }));
        this.dialogService.dialogForm(this.choosePod, true);
      }
    }, () => {
      this.appLoaderService.close();
    });
  }

  openLogs(name: string): void {
    this.podList = [];
    this.podDetails = {};
    this.selectedAppName = name;
    this.appLoaderService.open();
    this.ws.call('chart.release.pod_console_choices', [this.selectedAppName]).pipe(untilDestroyed(this)).subscribe((res) => {
      this.appLoaderService.close();
      this.podDetails = { ...res };
      this.podList = Object.keys(this.podDetails);
      if (this.podList.length == 0) {
        this.dialogService.confirm({
          title: helptext.podConsole.nopod.title,
          message: helptext.podConsole.nopod.message,
          hideCheckBox: true,
          buttonMsg: this.translate.instant('Close'),
          hideCancel: true,
        });
      } else {
        // Pods
        const podsConfig = this.choosePodForLogs.fieldConfig[0] as FormSelectConfig;
        podsConfig.value = this.podList[0];
        podsConfig.options = this.podList.map((item) => ({
          label: item,
          value: item,
        }));
        // Containers
        const containerConfig = this.choosePodForLogs.fieldConfig[1] as FormSelectConfig;
        containerConfig.value = this.podDetails[this.podList[0]][0];
        containerConfig.options = this.podDetails[this.podList[0]].map((item) => ({
          label: item,
          value: item,
        }));
        this.dialogService.dialogForm(this.choosePodForLogs, true);
      }
    }, () => {
      this.appLoaderService.close();
    });
  }

  doPodSelect(entityDialog: EntityDialogComponent): void {
    const pod = entityDialog.formGroup.controls['pods'].value;
    const command = entityDialog.formGroup.controls['command'].value;
    this.router.navigate(new Array('/apps/1/shell/').concat([this.selectedAppName, pod, command]));
    this.dialogService.closeAllDialogs();
  }

  doPodSelectForLogs(entityDialog: EntityDialogComponent): void {
    const pod = entityDialog.formGroup.controls['pods'].value;
    const container = entityDialog.formGroup.controls['containers'].value;
    const tailLines = entityDialog.formGroup.controls['tail_lines'].value;
    this.router.navigate(new Array('/apps/1/logs/').concat([this.selectedAppName, pod, container, tailLines]));
    this.dialogService.closeAllDialogs();
  }

  afterShellDialogInit(entityDialog: EntityDialogComponent): void {
    entityDialog.formGroup.controls['pods'].valueChanges.pipe(untilDestroyed(this)).subscribe((value) => {
      const containers = this.podDetails[value];
      const containerFc = _.find(entityDialog.fieldConfig, { name: 'containers' }) as FormSelectConfig;

      containerFc.options = containers.map((item) => ({
        label: item,
        value: item,
      }));
      entityDialog.formGroup.controls['containers'].setValue(containers[0]);
    });
  }

  afterLogsDialogInit(entityDialog: EntityDialogComponent): void {
    entityDialog.formGroup.controls['pods'].valueChanges.pipe(untilDestroyed(this)).subscribe((value) => {
      const containers = this.podDetails[value];
      const containerFc = _.find(entityDialog.fieldConfig, { name: 'containers' }) as FormSelectConfig;
      containerFc.options = containers.map((item) => ({
        label: item,
        value: item,
      }));
      entityDialog.formGroup.controls['containers'].setValue(containers[0]);
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

  // On click checkbox
  onChangeCheck(): void {
    this.refreshToolbarMenus();
  }

  // Refresh Toolbar menus
  refreshToolbarMenus(): void {
    const isSelectedOneMore: boolean = this.getSelectedItems().length > 0;
    const isSelectedAll = !this.filteredChartItems.find((item) => !item.selected);
    this.updateTab.emit({ name: ApplicationUserEventName.UpdateToolbar, value: isSelectedOneMore, isSelectedAll });
  }
}
