import {
  ApplicationRef, Component, Injector, Type,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as filesize from 'filesize';
import { PreferencesService } from 'app/core/services/preferences.service';
import helptext from 'app/helptext/storage/snapshots/snapshots';
import { Snapshot } from 'app/interfaces/storage.interface';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/pages/common/entity/entity-dialog/entity-dialog.component';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { EntityJobComponent } from 'app/pages/common/entity/entity-job/entity-job.component';
import { EntityTableAction, EntityTableConfig } from 'app/pages/common/entity/entity-table/entity-table.interface';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { WebSocketService, StorageService, DialogService } from 'app/services';
import { LocaleService } from 'app/services/locale.service';
import { T } from 'app/translate-marker';
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
  queryCall: 'zfs.snapshot.query' = 'zfs.snapshot.query';
  route_add: string[] = ['storage', 'snapshots', 'add'];
  protected route_add_tooltip = 'Add Snapshot';
  wsDelete: 'zfs.snapshot.delete' = 'zfs.snapshot.delete';
  protected loaderOpen = false;
  protected entityList: any;
  protected rollback: any;
  globalConfig = {
    id: 'config',
    onClick: () => {
      this.toggleExtraCols();
    },
  };

  // Variables to show or hide the extra columns
  queryCallOption: any[] = [];
  protected queryCallOptionShow = [[['pool', '!=', 'freenas-boot'], ['pool', '!=', 'boot-pool']], { select: ['name', 'properties'], order_by: ['name'] }];
  protected queryCallOptionHide = [[['pool', '!=', 'freenas-boot'], ['pool', '!=', 'boot-pool']], { select: ['name'], order_by: ['name'] }];
  hasDetails: boolean;
  columnFilter = window.localStorage.getItem('snapshotXtraCols') === 'true';
  rowDetailComponent: Type<SnapshotDetailsComponent>;
  snapshotXtraCols = false;

  columns = [
    { name: 'Dataset', prop: 'dataset' },
    { name: 'Snapshot', prop: 'snapshot' },
    { name: 'Used', prop: 'used' },
    { name: 'Date Created', prop: 'created' },
    { name: 'Referenced', prop: 'referenced' },
  ];

  columnsHide: any[] = [
    { name: 'Dataset', prop: 'dataset' },
    { name: 'Snapshot', prop: 'snapshot' },
  ];

  columnsShow: any[] = [
    { name: 'Dataset', prop: 'dataset' },
    { name: 'Snapshot', prop: 'snapshot' },
    { name: 'Used', prop: 'used' },
    { name: 'Date Created', prop: 'created' },
    { name: 'Referenced', prop: 'referenced' },
  ];
  // End the show/hide section

  rowIdentifier = 'dataset';
  config: any = {
    paging: true,
    sorting: { columns: this.columns },
    multiSelect: true,
    deleteMsg: {
      title: 'Snapshot',
      key_props: ['dataset', 'snapshot'],
    },
  };

  wsMultiDelete: 'core.bulk' = 'core.bulk';
  multiActions: any[] = [
    {
      id: 'mdelete',
      label: 'Delete',
      icon: 'delete',
      enable: true,
      ttpos: 'above',
      onClick: (selected: any) => {
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
    customSubmit: this.rollbackSubmit,
    parent: this,
    warning: helptext.rollback_warning,
  };

  constructor(protected _router: Router, protected _route: ActivatedRoute,
    protected ws: WebSocketService, protected localeService: LocaleService,
    protected _injector: Injector, protected _appRef: ApplicationRef,
    protected storageService: StorageService, protected dialogService: DialogService,
    protected prefService: PreferencesService, protected dialog: MatDialog,
    protected translate: TranslateService) {
    if (window.localStorage.getItem('snapshotXtraCols') === 'true') {
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

  resourceTransformIncomingRestData(rows: any[]): any[] {
    /// /
    rows.forEach((row) => {
      if (row.properties) {
        row.used = this.storageService.convertBytestoHumanReadable(row.properties.used.rawvalue);
        row.created = this.localeService.formatDateTime(row.properties.creation.parsed.$date);
        row.referenced = this.storageService.convertBytestoHumanReadable(row.properties.referenced.rawvalue);
      }
    });
    /// /
    return rows;
  }

  rowValue(row: any, attr: any): any {
    switch (attr) {
      case 'used':
        return filesize(row[attr], { standard: 'iec' });
      case 'refer':
        return filesize(row[attr], { standard: 'iec' });
      default:
        return row[attr];
    }
  }

  getActions(): EntityTableAction[] {
    return [
      {
        id: 'delete',
        icon: 'delete',
        name: this.config.name,
        label: helptext.label_delete,
        onClick: (snapshot: any) => this.doDelete(snapshot),
      },
      {
        id: 'clone',
        icon: 'filter_none',
        name: this.config.name,
        label: helptext.label_clone,
        onClick: (snapshot: any) =>
          this._router.navigate(new Array('/').concat(['storage', 'snapshots', 'clone', snapshot.name])),
      },
      {
        id: 'rollback',
        icon: 'history',
        name: this.config.name,
        label: helptext.label_rollback,
        onClick: (snapshot: any) => this.doRollback(snapshot),
      },
    ] as EntityTableAction[];
  }

  afterInit(entityList: any): void {
    this.entityList = entityList;
  }

  callGetFunction(entityList: any): void {
    this.ws.call('systemdataset.config').toPromise().then((res) => {
      if (res && res.basename && res.basename !== '') {
        this.queryCallOption[0][2] = (['name', '!^', res.basename]);
      }
      this.ws.call(this.queryCall, this.queryCallOption).pipe(untilDestroyed(this)).subscribe((res1) => {
        entityList.handleData(res1, true);
      },
      () => {
        new EntityUtils().handleWSError(this, res, entityList.dialogService);
      });
    });
  }

  dataHandler(list: { rows: { name: string; dataset: string; snapshot: string }[] }): void {
    list.rows = list.rows.map((ss) => {
      const [datasetName, snapshotName] = ss.name.split('@');
      ss.dataset = datasetName;
      ss.snapshot = snapshotName;
      return ss;
    });
  }

  wsMultiDeleteParams(selected: any[]): any[] {
    const params: any[] = ['zfs.snapshot.delete'];

    const snapshots = selected.map((item) => [item.dataset + '@' + item.snapshot]);
    params.push(snapshots);
    params.push('{0}');

    return params;
  }

  doDelete(item: any): void {
    const deleteMsg = T('Delete snapshot ') + item.name + '?';
    this.entityList.dialogService.confirm(T('Delete'), deleteMsg, false, T('Delete')).pipe(untilDestroyed(this)).subscribe((res: boolean) => {
      if (res) {
        this.entityList.loader.open();
        this.entityList.loaderOpen = true;
        this.ws.call(this.wsDelete, [item.name]).pipe(untilDestroyed(this)).subscribe(
          () => {
            this.entityList.getData();
          },
          (res: any) => {
            new EntityUtils().handleWSError(this, res, this.entityList.dialogService);
            this.entityList.loaderOpen = false;
            this.entityList.loader.close();
          },
        );
      }
    });
  }

  restructureData(selected: Snapshot[]): DialogData {
    const datasets: string[] = [];
    const snapshots: { [index: string]: string[] } = {};
    selected.forEach((item: Snapshot) => {
      if (!snapshots[item.dataset]) {
        datasets.push(item.dataset);
        snapshots[item.dataset] = [];
      }

      snapshots[item.dataset].push(item.snapshot);
    });

    return { datasets, snapshots };
  }

  getMultiDeleteMessage(selected: Snapshot[]): string {
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

    info.datasets.forEach((dataset: any) => {
      const totalSnapshots: number = info.snapshots[dataset].length;
      const snapshotText = this.translate.instant(
        '{ n, plural, one {# snapshot} other {# snapshots} }',
        { n: totalSnapshots },
      );
      const header = `<br/> <div><strong>${dataset}</strong> (${snapshotText}) </div>`;
      const listContent: string[] = [];

      info.snapshots[dataset].forEach((snapshot: any) => {
        listContent.push('<li>&nbsp;&nbsp;&nbsp;&nbsp;' + snapshot + '</li>');
      });

      const listContentString: string = listContent.toString();
      message += datasetStart + header + listStart + listContentString.replace(/\,/g, '') + listEnd + breakTag + datasetEnd;
    });

    return message;
  }

  doMultiDelete(selected: any): void {
    const multiDeleteMsg = this.getMultiDeleteMessage(selected);
    this.dialogService.confirm('Delete', multiDeleteMsg, false, T('Delete')).pipe(untilDestroyed(this)).subscribe((res: boolean) => {
      if (res) {
        this.startMultiDeleteProgress(selected);
      }
    });
  }

  startMultiDeleteProgress(selected: any): void {
    const params = this.wsMultiDeleteParams(selected);
    const dialogRef = this.dialog.open(EntityJobComponent, { data: { title: T('Deleting Snapshots') }, disableClose: true });
    dialogRef.componentInstance.setCall(this.wsMultiDelete, params);
    dialogRef.componentInstance.submit();

    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe((job_res: any) => {
      const jobErrors: string[] = [];
      const jobSuccess: any[] = [];

      job_res.result.forEach((item: any) => {
        if (item.error) {
          jobErrors.push(item.error);
        } else {
          jobSuccess.push(item.result);
        }
      });

      dialogRef.close();
      this.entityList.getData();
      this.entityList.selected = [];

      if (jobErrors.length > 0) {
        const errorTitle = T('Warning') + ', ' + jobErrors.length + ' of ' + params[1].length + ' ' + T('snapshots could not be deleted.');

        let errorMessage = jobErrors.map((err) => err + '\n').toString();
        errorMessage = errorMessage.split(',').join('');
        errorMessage = errorMessage.split('[').join('\n *** [');
        errorMessage = errorMessage.split(']').join(']\n');

        this.dialogService.errorReport(errorTitle, '', errorMessage);
      } else {
        this.dialogService.Info(
          this.translate.instant('Deleted {n, plural, one {# snapshot} other {# snapshots}}', { n: jobSuccess.length }),
          '',
          '320px',
          'info',
          true,
        );
      }
    });

    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((err: any) => {
      new EntityUtils().handleWSError(this.entityList, err, this.dialogService);
      dialogRef.close();
    });
  }

  doRollback(item: any): void {
    this.entityList.loader.open();
    this.entityList.loaderOpen = true;
    this.ws.call(this.queryCall, [[['id', '=', item.name]]]).pipe(untilDestroyed(this)).subscribe((res) => {
      const snapshot = res[0];
      this.entityList.loader.close();
      this.entityList.loaderOpen = false;
      const msg = T(`Use snapshot <i>${item.snapshot}</i> to roll <b>${item.dataset}</b> back to `)
        + new Date(snapshot.properties.creation.parsed.$date).toLocaleString() + '?';
      this.rollbackFormConf.message = msg;
      this.rollback = snapshot;
      this.entityList.dialogService.dialogForm(this.rollbackFormConf);
    }, (err) => {
      this.entityList.loader.close();
      this.entityList.loaderOpen = false;
      new EntityUtils().handleWSError(this.entityList, err, this.entityList.dialogService);
    });
  }

  rollbackSubmit(entityDialog: EntityDialogComponent): void {
    const parent = entityDialog.parent;
    const item = entityDialog.parent.rollback;
    const recursive = entityDialog.formValue.recursive;
    const data: any = {};
    if (recursive !== null) {
      data[recursive] = true;
    }
    data['force'] = true;
    parent.entityList.loader.open();
    parent.entityList.loaderOpen = true;
    parent.ws
      .call('zfs.snapshot.rollback', [item.name, data])
      .pipe(untilDestroyed(this)).subscribe(
        () => {
          entityDialog.dialogRef.close();
          parent.entityList.getData();
        },
        (err: any) => {
          parent.entityList.loaderOpen = false;
          parent.entityList.loader.close();
          entityDialog.dialogRef.close();
          new EntityUtils().handleWSError(parent.entityList, err, parent.entityList.dialogService);
        },
      );
  }

  toggleExtraCols(): void {
    let title; let message; let
      button;
    if (this.snapshotXtraCols) {
      title = helptext.extra_cols.title_hide;
      message = helptext.extra_cols.message_hide;
      button = helptext.extra_cols.button_hide;
    } else {
      title = helptext.extra_cols.title_show;
      message = helptext.extra_cols.message_show;
      button = helptext.extra_cols.button_show;
    }
    this.dialogService.confirm(title, message, true, button).pipe(untilDestroyed(this)).subscribe((res: boolean) => {
      if (res) {
        this.entityList.loader.open();
        this.snapshotXtraCols = !this.snapshotXtraCols;
        window.localStorage.setItem('snapshotXtraCols', this.snapshotXtraCols.toString());
        document.location.reload(true);
      }
    });
  }
}
