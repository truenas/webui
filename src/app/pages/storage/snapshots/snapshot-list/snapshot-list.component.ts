import { ApplicationRef, Component, Injector } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { WebSocketService, StorageService, DialogService } from 'app/services';
import { PreferencesService } from 'app/core/services/preferences.service';
import { Subscription } from 'rxjs';
import { LocaleService } from 'app/services/locale.service';
import { T } from '../../../../translate-marker';
import { EntityUtils } from '../../../common/entity/utils';
import { EntityJobComponent } from '../../../common/entity/entity-job/entity-job.component';
import { SnapshotDetailsComponent } from './components/snapshot-details.component';
import helptext from './../../../../helptext/storage/snapshots/snapshots';
import { DialogFormConfiguration } from '../../../common/entity/entity-dialog/dialog-form-configuration.interface';
import { MatDialog } from '@angular/material/dialog';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface'

@Component({
  selector: 'app-snapshot-list',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`
})
export class SnapshotListComponent {
  public title = "Snapshots";
  protected queryCall = 'zfs.snapshot.query';
  protected route_add: string[] = ['storage', 'snapshots', 'add'];
  protected route_add_tooltip = "Add Snapshot";
  protected wsDelete = 'zfs.snapshot.delete';
  protected loaderOpen = false;
  protected entityList: any;
  protected rollback: any;
  public busy: Subscription;
  public sub: Subscription;
  protected globalConfig = {
    id: "config",
    onClick: () => {
      this.toggleExtraCols();
    }
  };

  // Vairables to show or hide the extra columns
  protected queryCallOption = [];
  protected queryCallOptionShow = [[["pool", "!=", "freenas-boot"], ["pool", "!=", "boot-pool"]], {"select": ["name", "properties"], "order_by": ["name"]}];
  protected queryCallOptionHide = [[["pool", "!=", "freenas-boot"], ["pool", "!=", "boot-pool"]], {"select": ["name"], "order_by": ["name"]}];
  protected hasDetails: boolean;
  protected columnFilter = window.localStorage.getItem('snapshotXtraCols') === 'true' ? true : false;
  protected rowDetailComponent;
  public snapshotXtraCols = false;

  public columns: Array<any> = [
    {name : 'Dataset', prop : 'dataset'},
    {name : 'Snapshot', prop : 'snapshot' },
    {name : 'Used', prop : 'used' },
    {name : 'Date Created', prop : 'created'},
    {name : 'Referenced', prop : 'referenced'}
  ];

  public columnsHide: Array<any> = [
    {name : 'Dataset', prop : 'dataset'},
    {name : 'Snapshot', prop : 'snapshot'}
  ];

  public columnsShow: Array<any> = [
    {name : 'Dataset', prop : 'dataset'},
    {name : 'Snapshot', prop : 'snapshot' },
    {name : 'Used', prop : 'used' },
    {name : 'Date Created', prop : 'created'},
    {name : 'Referenced', prop : 'referenced'}
  ];
// End the show/hide section

  public rowIdentifier = 'dataset';
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
    multiSelect: true,
    deleteMsg: {
      title: 'Snapshot',
      key_props: ['dataset', 'snapshot']
    },
  };

  protected wsMultiDelete = 'core.bulk';
  public multiActions: Array < any > = [
    {
      id: "mdelete",
      label: "Delete",
      icon: "delete",
      enable: true,
      ttpos: "above",
      onClick: (selected) => {
        this.doMultiDelete(selected);
      }
    }
  ];

  protected rollbackFieldConf: FieldConfig[] = [
    {
      type: 'radio',
      name: 'recursive',
      options: [
        {
          value: null,
          label: helptext.rollback_dataset_placeholder,
          tooltip: helptext.rollback_dataset_tooltip
        },
        {
          value: 'recursive',
          label: helptext.rollback_recursive_placeholder,
          tooltip: helptext.rollback_recursive_tooltip
        },
        {
          value: 'recursive_clones',
          label: helptext.rollback_recursive_clones_placeholder,
          tooltip: helptext.rollback_recursive_clones_tooltip
        }
      ],
      placeholder: helptext.rollback_recursive_radio_placeholder,
      tooltip: helptext.rollback_recursive_radio_tooltip,
      value: null,
    },
    {
      type: 'checkbox',
      name: 'confirm',
      placeholder: helptext.rollback_confirm,
      required: true
    }
  ];
  public rollbackFormConf: DialogFormConfiguration = {
    title: helptext.rollback_title,
    message: '',
    fieldConfig: this.rollbackFieldConf,
    method_ws: 'zfs.snapshot.rollback',
    saveButtonText: helptext.label_rollback,
    customSubmit: this.rollbackSubmit,
    parent: this,
    warning: helptext.rollback_warning,
  }

  constructor(protected _router: Router, protected _route: ActivatedRoute,
    protected ws: WebSocketService, protected localeService: LocaleService,
    protected _injector: Injector, protected _appRef: ApplicationRef,
    protected storageService: StorageService, protected dialogService: DialogService,
    protected prefService: PreferencesService, protected dialog:MatDialog) {
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

  resourceTransformIncomingRestData(rows: any) {
    //// 
    rows.forEach((row) => {
      if (row.properties) {
        row.used = this.storageService.convertBytestoHumanReadable(row.properties.used.rawvalue);
        row.created = this.localeService.formatDateTime(row.properties.creation.parsed.$date);
        row.referenced = this.storageService.convertBytestoHumanReadable(row.properties.referenced.rawvalue);
      }
    })
    ////
    return rows;
  }

  rowValue(row, attr) {
    switch (attr) {
      case 'used':
        return (<any>window).filesize(row[attr], { standard: "iec" });
      case 'refer':
        return (<any>window).filesize(row[attr], { standard: "iec" });
      default:
        return row[attr];
    }
  }

  getActions() {
    return [
      {
        id: "delete",
        icon: "delete",
        name: this.config.name,
        label: helptext.label_delete,
        onClick: snapshot => this.doDelete(snapshot)
      },
      {
        id: "clone",
        icon: "filter_none",
        name: this.config.name,
        label: helptext.label_clone,
        onClick: snapshot =>
          this._router.navigate(new Array("/").concat(["storage", "snapshots", "clone", snapshot.name]))
      },
      {
        id: "rollback",
        icon: "history",
        name: this.config.name,
        label: helptext.label_rollback,
        onClick: snapshot => this.doRollback(snapshot)
      }
    ];
  }

  afterInit(entityList: any) {
    this.entityList = entityList;
  }

  preInit(entityList: any) {
    this.sub = this._route.params.subscribe(params => { });
  }

  callGetFunction(entityList) {
    this.ws.call('systemdataset.config').toPromise().then((res) => {
      if (res && res.basename && res.basename !== '') {
        this.queryCallOption[0][2] = (["name", "!^", res.basename]);
      }
      this.ws.call(this.queryCall, this.queryCallOption).subscribe((res1) => {
        entityList.handleData(res1, true);
      },
      (err) => {
          new EntityUtils().handleWSError(this, res, entityList.dialogService);
      });
    });
  }

  dataHandler(list: { rows: { name: string, dataset: string, snapshot: string }[] }): void {
    list.rows = list.rows.map(ss => {
      const [datasetName, snapshotName] = ss.name.split('@');
      ss.dataset = datasetName;
      ss.snapshot = snapshotName;
      return ss;
    });
  }

  wsMultiDeleteParams(selected: any) {
    let params: Array<any> = ['zfs.snapshot.delete'];
    let selectedId = [];
    for (const i in selected) {
     selectedId.push([selected[i].name]);
    }
    params.push(selectedId);
    params.push("{0}");
    return params;
  }

  doDelete(item) {
    const deleteMsg = T("Delete snapshot ") + item.name  + "?";
    this.entityList.dialogService.confirm(T("Delete"), deleteMsg, false, T('Delete')).subscribe((res) => {
      if (res) {
        this.entityList.loader.open();
        this.entityList.loaderOpen = true;
        this.ws.call(this.wsDelete, [item.name]).subscribe(
          (res) => { 
            this.entityList.getData() 
          },
          (res) => {
            new EntityUtils().handleWSError(this, res, this.entityList.dialogService);
            this.entityList.loaderOpen = false;
            this.entityList.loader.close();
        });
      }
    });
  }

  doMultiDelete(selected){
    let multiDeleteMsg = this.entityList.getMultiDeleteMessage(selected);
    this.dialogService.confirm('Delete', multiDeleteMsg, false, T('Delete') ).subscribe((res) => {
      if(res){
        this.startMultiDeleteProgress(selected);
      }
    });
  }

  startMultiDeleteProgress(selected){
    const params = this.wsMultiDeleteParams(selected);
    let dialogRef = this.dialog.open(EntityJobComponent, { data: { title: T("Deleting Snapshots")}, disableClose: true });
    dialogRef.componentInstance.setCall(this.wsMultiDelete, params);
    dialogRef.componentInstance.submit();

    dialogRef.componentInstance.success.subscribe((job_res) => {
      dialogRef.close();
      this.entityList.getData();
      this.entityList.selected = [];

      let infoMessage: string = T('Deleted') + ' ' + params[1].length + ' ';
      infoMessage += params[1].length > 1 ? T('snapshots') : T('snapshot');
      this.dialogService.Info(infoMessage, '', '320px', 'info', true );
    });

    dialogRef.componentInstance.failure.subscribe((err) => {
      new EntityUtils().handleWSError(this.entityList, err, this.dialogService);
      dialogRef.close();
    });
  }

  doRollback(item) {
    this.entityList.loader.open();
    this.entityList.loaderOpen = true;
    this.ws.call(this.queryCall, [[["id","=",item.name]]]).subscribe(res => {
      const snapshot = res[0];
      this.entityList.loader.close();
      this.entityList.loaderOpen = false;
      const msg = T(`Use snapshot <i>${item.snapshot}</i> to roll <b>${item.dataset}</b> back to `) + 
        new Date(snapshot.properties.creation.parsed.$date).toLocaleString() + '?';
      this.rollbackFormConf.message = msg;
      this.rollback = snapshot;
      this.entityList.dialogService.dialogForm(this.rollbackFormConf);
    }, err => {
      this.entityList.loader.close();
      this.entityList.loaderOpen = false;
      new EntityUtils().handleWSError(this.entityList, err, this.entityList.dialogService);
    });
  }

  rollbackSubmit(entityDialog) {
    const parent = entityDialog.parent;
    const item = entityDialog.parent.rollback;
    const recursive = entityDialog.formValue.recursive;
    const data = {};
    if (recursive !== null) {
      data[recursive] = true;
    }
    data["force"] = true;
    parent.entityList.loader.open();
    parent.entityList.loaderOpen = true;
    parent.ws
      .call('zfs.snapshot.rollback', [item.name, data])
      .subscribe(
        (res) => {
          entityDialog.dialogRef.close();
          parent.entityList.getData();
        },
        (err) => {
          parent.entityList.loaderOpen = false;
          parent.entityList.loader.close();
          entityDialog.dialogRef.close();
          new EntityUtils().handleWSError(parent.entityList, err, parent.entityList.dialogService);
        });
  }

  toggleExtraCols() {
    let title, message, button;
    if (this.snapshotXtraCols) {
      title = helptext.extra_cols.title_hide;
      message = helptext.extra_cols.message_hide;
      button = helptext.extra_cols.button_hide;
    } else {
      title = helptext.extra_cols.title_show;
      message = helptext.extra_cols.message_show;
      button = helptext.extra_cols.button_show;
    }
    this.dialogService.confirm(title, message, true, button).subscribe(res => {
     if (res) {
       this.entityList.loader.open();
       this.snapshotXtraCols = !this.snapshotXtraCols;
       window.localStorage.setItem('snapshotXtraCols', this.snapshotXtraCols.toString());
       document.location.reload(true);
     }
    })
  }

}
