import { Component, Type } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TooltipPosition } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import helptext from 'app/helptext/storage/snapshots/snapshots';
import { CoreBulkQuery, CoreBulkResponse } from 'app/interfaces/core-bulk.interface';
import { Job } from 'app/interfaces/job.interface';
import { QueryParams } from 'app/interfaces/query-api.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { ZfsRollbackParams, ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/pages/common/entity/entity-dialog/entity-dialog.component';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { EntityJobComponent } from 'app/pages/common/entity/entity-job/entity-job.component';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table/entity-table.component';
import {
  EntityTableAction,
  EntityTableConfig,
  EntityTableConfigConfig,
} from 'app/pages/common/entity/entity-table/entity-table.interface';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { SnapshotListRow } from 'app/pages/storage/snapshots/snapshot-list/snapshot-list-row.interface';
import { WebSocketService, StorageService, DialogService } from 'app/services';
import { LocaleService } from 'app/services/locale.service';
import { SnapshotDetailsComponent } from './components/snapshot-details.component';

interface DialogData {
  datasets: string[];
  snapshots: { [index: string]: string[] };
}

@UntilDestroy()
@Component({
  selector: 'app-snapshot-list',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
})
export class SnapshotListComponent implements EntityTableConfig {
  title = 'Snapshots';
  queryCall = 'zfs.snapshot.query' as const;
  route_add: string[] = ['storage', 'snapshots', 'add'];
  route_add_tooltip = 'Add Snapshot';
  wsDelete = 'zfs.snapshot.delete' as const;
  protected loaderOpen = false;
  protected entityList: EntityTableComponent;
  protected rollback: ZfsSnapshot;
  globalConfig = {
    id: 'config',
    onClick: () => {
      this.toggleExtraCols();
    },
  };

  // Variables to show or hide the extra columns
  queryCallOption: QueryParams<ZfsSnapshot> = [];
  protected queryCallOptionShow: QueryParams<ZfsSnapshot> = [
    [['pool', '!=', 'freenas-boot'], ['pool', '!=', 'boot-pool']],
    { select: ['name', 'properties'], order_by: ['name'] },
  ];
  protected queryCallOptionHide: QueryParams<ZfsSnapshot> = [
    [['pool', '!=', 'freenas-boot'], ['pool', '!=', 'boot-pool']],
    { select: ['name'], order_by: ['name'] },
  ];
  hasDetails: boolean;
  columnFilter = false;
  rowDetailComponent: Type<SnapshotDetailsComponent>;
  snapshotXtraCols = false;

  columns = [
    { name: 'Dataset', prop: 'dataset' },
    { name: 'Snapshot', prop: 'snapshot' },
    { name: 'Used', prop: 'used' },
    { name: 'Date Created', prop: 'created' },
    { name: 'Referenced', prop: 'referenced' },
  ];

  columnsHide = [
    { name: 'Dataset', prop: 'dataset' },
    { name: 'Snapshot', prop: 'snapshot' },
  ];

  columnsShow = [
    { name: 'Dataset', prop: 'dataset' },
    { name: 'Snapshot', prop: 'snapshot' },
    { name: 'Used', prop: 'used' },
    { name: 'Date Created', prop: 'created' },
    { name: 'Referenced', prop: 'referenced' },
  ];
  // End the show/hide section

  rowIdentifier = 'name';
  config: EntityTableConfigConfig = {
    paging: true,
    sorting: { columns: this.columns },
    multiSelect: true,
    deleteMsg: {
      title: 'Snapshot',
      key_props: ['dataset', 'snapshot'],
    },
  };

  wsMultiDelete = 'core.bulk' as const;
  multiActions = [
    {
      id: 'mdelete',
      label: 'Delete',
      icon: 'delete',
      enable: true,
      ttpos: 'above' as TooltipPosition,
      onClick: (selected: SnapshotListRow[]) => {
        this.doMultiDelete(selected);
      },
    },
  ];

  protected rollbackFieldConf: FieldConfig[] = [
    {
      type: 'radio',
      name: 'recursive',
      options: [
        {
          value: null,
          label: helptext.rollback_dataset_placeholder,
          tooltip: helptext.rollback_dataset_tooltip,
        },
        {
          value: 'recursive',
          label: helptext.rollback_recursive_placeholder,
          tooltip: helptext.rollback_recursive_tooltip,
        },
        {
          value: 'recursive_clones',
          label: helptext.rollback_recursive_clones_placeholder,
          tooltip: helptext.rollback_recursive_clones_tooltip,
        },
      ],
      placeholder: helptext.rollback_recursive_radio_placeholder,
      tooltip: helptext.rollback_recursive_radio_tooltip,
      value: null,
    },
    {
      type: 'checkbox',
      name: 'confirm',
      placeholder: helptext.rollback_confirm,
      required: true,
    },
  ];
  rollbackFormConf: DialogFormConfiguration = {
    title: helptext.rollback_title,
    message: '',
    fieldConfig: this.rollbackFieldConf,
    method_ws: 'zfs.snapshot.rollback',
    saveButtonText: helptext.label_rollback,
    customSubmit: (entityDialog) => this.rollbackSubmit(entityDialog),
    parent: this,
    warning: helptext.rollback_warning,
  };

  constructor(
    private router: Router,
    protected ws: WebSocketService,
    protected localeService: LocaleService,
    protected storageService: StorageService,
    protected dialogService: DialogService,
    protected dialog: MatDialog,
    protected translate: TranslateService,
  ) {
    this.setExtraColumns(window.localStorage.getItem('snapshotXtraCols') === 'true');
  }

  setExtraColumns(showExtra: boolean): void {
    if (showExtra) {
      this.queryCallOption = this.queryCallOptionShow;
      this.rowDetailComponent = null;
      this.columnFilter = true;
      this.hasDetails = false;
      this.columns = this.columnsShow.slice(0);
      this.snapshotXtraCols = true;
    } else {
      this.queryCallOption = this.queryCallOptionHide;
      this.rowDetailComponent = SnapshotDetailsComponent;
      this.columnFilter = false;
      this.hasDetails = true;
      this.columns = this.columnsHide.slice(0);
      this.snapshotXtraCols = false;
    }
  }

  resourceTransformIncomingRestData(rows: ZfsSnapshot[]): SnapshotListRow[] {
    return rows.map((row) => {
      const [datasetName, snapshotName] = row.name.split('@');

      const transformedRow = {
        id: row.name,
        dataset: datasetName,
        snapshot: snapshotName,
        properties: row.properties,
        name: row.name,
      } as SnapshotListRow;

      if (row.properties) {
        transformedRow.used = this.storageService.convertBytestoHumanReadable(row.properties.used.rawvalue);
        transformedRow.created = this.localeService.formatDateTime(row.properties.creation.parsed.$date);
        transformedRow.referenced = this.storageService.convertBytestoHumanReadable(row.properties.referenced.rawvalue);
      }

      return transformedRow;
    });
  }

  getActions(): EntityTableAction[] {
    return [
      {
        id: 'delete',
        icon: 'delete',
        name: this.config.name,
        label: helptext.label_delete,
        onClick: (snapshot: SnapshotListRow) => this.doDelete(snapshot),
      },
      {
        id: 'clone',
        icon: 'filter_none',
        name: this.config.name,
        label: helptext.label_clone,
        onClick: (snapshot: SnapshotListRow) => {
          this.router.navigate(['/', 'storage', 'snapshots', 'clone', snapshot.name]);
        },
      },
      {
        id: 'rollback',
        icon: 'history',
        name: this.config.name,
        label: helptext.label_rollback,
        onClick: (snapshot: SnapshotListRow) => this.doRollback(snapshot),
      },
    ] as EntityTableAction[];
  }

  afterInit(entityList: EntityTableComponent): void {
    this.entityList = entityList;
  }

  callGetFunction(entityList: EntityTableComponent): void {
    this.ws.call('systemdataset.config').toPromise().then((config) => {
      if (config && config.basename && config.basename !== '') {
        this.queryCallOption[0][2] = (['name', '!^', config.basename]);
      }
      this.ws.call(this.queryCall, this.queryCallOption as QueryParams<ZfsSnapshot>)
        .pipe(untilDestroyed(this))
        .subscribe((snapshot) => {
          entityList.handleData(snapshot, true);
        },
        (error) => {
          new EntityUtils().handleWSError(this, error, entityList.dialogService);
        });
    });
  }

  wsMultiDeleteParams(selected: SnapshotListRow[]): (string | string[][])[] {
    const snapshots = selected.map((item) => [item.dataset + '@' + item.snapshot]);
    return [
      'zfs.snapshot.delete',
      snapshots,
      '{0}',
    ];
  }

  doDelete(item: SnapshotListRow): void {
    this.entityList.dialogService.confirm({
      title: this.translate.instant('Delete'),
      message: this.translate.instant('Delete snapshot {name}?', { name: item.name }),
      buttonMsg: this.translate.instant('Delete'),
    })
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => {
        this.entityList.loader.open();
        this.entityList.loaderOpen = true;
        this.ws.call(this.wsDelete, [item.name]).pipe(untilDestroyed(this)).subscribe(
          () => {
            this.entityList.getData();
          },
          (res: WebsocketError) => {
            new EntityUtils().handleWSError(this, res, this.entityList.dialogService);
            this.entityList.loaderOpen = false;
            this.entityList.loader.close();
          },
        );
      });
  }

  restructureData(selected: SnapshotListRow[]): DialogData {
    const datasets: string[] = [];
    const snapshots: { [index: string]: string[] } = {};
    selected.forEach((item) => {
      if (!snapshots[item.dataset]) {
        datasets.push(item.dataset);
        snapshots[item.dataset] = [];
      }

      snapshots[item.dataset].push(item.snapshot);
    });

    return { datasets, snapshots };
  }

  getMultiDeleteMessage(selected: SnapshotListRow[]): string {
    let message = this.translate.instant(
      '<strong>The following { n, plural, one {snapshot} other {# snapshots} } will be deleted. Are you sure you want to proceed?</strong>',
      { n: selected.length },
    );

    message += '<br>';
    const info: DialogData = this.restructureData(selected);

    const datasetStart = "<div class='mat-list-item'>";
    const datasetEnd = '</div>';
    const listStart = '<ul>';
    const listEnd = '</ul>';
    const breakTag = '<br>';

    info.datasets.forEach((dataset) => {
      const totalSnapshots: number = info.snapshots[dataset].length;
      const snapshotText = this.translate.instant(
        '{ n, plural, one {# snapshot} other {# snapshots} }',
        { n: totalSnapshots },
      );
      const header = `<br/> <div><strong>${dataset}</strong> (${snapshotText}) </div>`;
      const listContent: string[] = [];

      info.snapshots[dataset].forEach((snapshot) => {
        listContent.push('<li>&nbsp;&nbsp;&nbsp;&nbsp;' + snapshot + '</li>');
      });

      const listContentString: string = listContent.toString();
      message += datasetStart + header + listStart + listContentString.replace(/\,/g, '') + listEnd + breakTag + datasetEnd;
    });

    return message;
  }

  doMultiDelete(selected: SnapshotListRow[]): void {
    const multiDeleteMsg = this.getMultiDeleteMessage(selected);
    this.dialogService.confirm({
      title: 'Delete',
      message: multiDeleteMsg,
      buttonMsg: this.translate.instant('Delete'),
    })
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => this.startMultiDeleteProgress(selected));
  }

  startMultiDeleteProgress(selected: SnapshotListRow[]): void {
    const params = this.wsMultiDeleteParams(selected);
    const dialogRef = this.dialog.open(EntityJobComponent, { data: { title: this.translate.instant('Deleting Snapshots') }, disableClose: true });
    dialogRef.componentInstance.setCall(this.wsMultiDelete, params as CoreBulkQuery);
    dialogRef.componentInstance.submit();

    dialogRef.componentInstance.success
      .pipe(untilDestroyed(this))
      .subscribe((job_res: Job<CoreBulkResponse<boolean>[]>) => {
        const jobErrors: string[] = [];
        const jobSuccess: boolean[] = [];

        job_res.result.forEach((item) => {
          if (item.error) {
            jobErrors.push(item.error);
          } else {
            jobSuccess.push(item.result);
          }
        });

        dialogRef.close();
        this.entityList.getData();

        if (jobErrors.length > 0) {
          const errorTitle = this.translate.instant('Warning: {n} of {total} snapshots could not be deleted.', { n: jobErrors.length, total: params[1].length });

          let errorMessage = jobErrors.map((err) => err + '\n').toString();
          errorMessage = errorMessage.split(',').join('');
          errorMessage = errorMessage.split('[').join('\n *** [');
          errorMessage = errorMessage.split(']').join(']\n');

          this.dialogService.errorReport(errorTitle, '', errorMessage);
        } else {
          this.dialogService.info(
            this.translate.instant('Deleted {n, plural, one {# snapshot} other {# snapshots}}', { n: jobSuccess.length }),
            '',
            '320px',
            'info',
            true,
          );
        }
      });

    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((err) => {
      new EntityUtils().handleWSError(this.entityList, err, this.dialogService);
      dialogRef.close();
    });
  }

  doRollback(item: SnapshotListRow): void {
    this.entityList.loader.open();
    this.entityList.loaderOpen = true;
    this.ws.call(this.queryCall, [[['id', '=', item.name]]]).pipe(untilDestroyed(this)).subscribe((res) => {
      const snapshot = res[0];
      this.entityList.loader.close();
      this.entityList.loaderOpen = false;
      const msg = this.translate.instant(
        'Use snapshot <i>{snapshot}</i> to roll <b>{dataset}</b> back to {datetime}?',
        {
          snapshot: item.snapshot,
          dataset: item.dataset,
          datetime: new Date(snapshot.properties.creation.parsed.$date).toLocaleString(),
        },
      );
      this.rollbackFormConf.message = msg;
      this.rollback = snapshot;
      this.entityList.dialogService.dialogForm(this.rollbackFormConf);
    }, (err) => {
      this.entityList.loader.close();
      this.entityList.loaderOpen = false;
      new EntityUtils().handleWSError(this.entityList, err, this.entityList.dialogService);
    });
  }

  rollbackSubmit(entityDialog: EntityDialogComponent<this>): void {
    const item = this.rollback;
    const recursive = entityDialog.formValue.recursive;
    const data = {} as ZfsRollbackParams[1];
    if (recursive !== null) {
      data['recursive'] = true;
    }
    data['force'] = true;
    this.entityList.loader.open();
    this.entityList.loaderOpen = true;
    this.ws
      .call('zfs.snapshot.rollback', [item.name, data])
      .pipe(untilDestroyed(this)).subscribe(
        () => {
          entityDialog.dialogRef.close();
          this.entityList.getData();
        },
        (err: WebsocketError) => {
          this.entityList.loaderOpen = false;
          this.entityList.loader.close();
          entityDialog.dialogRef.close();
          new EntityUtils().handleWSError(this.entityList, err, this.entityList.dialogService);
        },
      );
  }

  toggleExtraCols(): void {
    let title: string;
    let message: string;
    let button: string;
    if (this.snapshotXtraCols) {
      title = helptext.extra_cols.title_hide;
      message = helptext.extra_cols.message_hide;
      button = helptext.extra_cols.button_hide;
    } else {
      title = helptext.extra_cols.title_show;
      message = helptext.extra_cols.message_show;
      button = helptext.extra_cols.button_show;
    }
    this.dialogService.confirm({
      title,
      message,
      hideCheckBox: true,
      buttonMsg: button,
    })
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => {
        this.entityList.loaderOpen = true;
        this.entityList.loader.open();
        this.snapshotXtraCols = !this.snapshotXtraCols;
        window.localStorage.setItem('snapshotXtraCols', this.snapshotXtraCols.toString());
        this.setExtraColumns(this.snapshotXtraCols);
        this.entityList.getData();
      });
  }
}
