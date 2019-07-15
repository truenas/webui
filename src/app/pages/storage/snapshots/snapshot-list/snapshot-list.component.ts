import { ApplicationRef, Component, Injector } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { WebSocketService } from 'app/services';
import { Subscription } from 'rxjs';
import { RestService } from '../../../../services/rest.service';
import { T } from '../../../../translate-marker';
import { EntityUtils } from '../../../common/entity/utils';
import { SnapshotDetailsComponent } from './components/snapshot-details.component';
import helptext from './../../../../helptext/storage/snapshots/snapshots';

@Component({
  selector: 'app-snapshot-list',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`
})
export class SnapshotListComponent {

  public title = "Snapshots";
  protected queryCall = 'zfs.snapshot.query';
  protected queryCallOption = [[["pool", "!=", "freenas-boot"]], {"select": ["name"], "order_by": ["name"]}];
  protected route_add: string[] = ['storage', 'snapshots', 'add'];
  protected route_add_tooltip = "Add Snapshot";
  protected wsDelete = 'zfs.snapshot.remove';
  protected loaderOpen = false;
  protected entityList: any;
  protected hasDetails = true;
  protected rowDetailComponent = SnapshotDetailsComponent;
  public busy: Subscription;
  public sub: Subscription;
  public columns: Array<any> = [
    {name : 'Dataset', prop : 'dataset', always_display: true, minWidth: 355},
    {name : 'Snapshot', prop : 'snapshot', always_display: true, minWidth: 355},
  ];
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
    multiSelect: true,
    deleteMsg: {
      title: 'Snapshot',
      key_props: ['name']
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
        this.entityList.doMultiDelete(selected);
      }
    }
  ];

  constructor(protected _router: Router, protected _route: ActivatedRoute,
    protected rest: RestService, protected ws: WebSocketService,
    protected _injector: Injector, protected _appRef: ApplicationRef) { }

  resourceTransformIncomingRestData(rows: any) {
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
        this.queryCallOption[0][1] = (["name", "!^", res.basename]);
      }
      this.ws.call(this.queryCall, this.queryCallOption).subscribe((res1) => {
        entityList.handleData(res1);
      },
      (err) => {
          new EntityUtils().handleWSError(this, res, entityList.dialogService);
      });
    });
  }

  getSelectedNames(selectedSnapshots) {
    let selected: any = [];
    for (let i in selectedSnapshots) {
      let snapshot = selectedSnapshots[i].name.split('@');
      selected.push([{"dataset": snapshot[0], "name": snapshot[1]}]);
    }
    return selected;
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
    let params: Array<any> = ['zfs.snapshot.remove'];
    params.push(this.getSelectedNames(selected));
    return params;
  }

  doDelete(item) {
    const deleteMsg = T("Delete snapshot ") + item.name  + "?";
    this.entityList.dialogService.confirm(T("Delete"), deleteMsg, false, T('Delete')).subscribe((res) => {
      if (res) {
        this.entityList.loader.open();
        this.entityList.loaderOpen = true;
        let snapshot = item.name.split('@');
        this.ws.call(this.wsDelete, [{ "dataset": snapshot[0], "name": snapshot[1]}]).subscribe(
          (res) => { this.entityList.getData() },
          (res) => {
            new EntityUtils().handleWSError(this, res, this.entityList.dialogService);
            this.entityList.loaderOpen = false;
            this.entityList.loader.close();
        });
      }
    });
  }

  doRollback(item) {
    const warningMsg = T("<b>WARNING:</b> Rolling back to this snapshot will permanently delete later snapshots of this dataset. Do not roll back until all desired snapshots have been backed up!");
    const msg = T("<br><br>Roll back to snapshot <i>") + item.name + '</i> from ' + item.creation + '?';

    this.entityList.dialogService.confirm(T("Warning"), warningMsg + msg, false, T('Rollback')).subscribe(res => {
      let data = {"force" : true};
      if (res) {
        this.entityList.loader.open();
        this.entityList.loaderOpen = true;
        this.rest
        .post('storage/snapshot' + '/' + item.name + '/rollback/', {
          body : JSON.stringify(data),
        })
        .subscribe(
          (res) => { this.entityList.getData() },
          (res) => {
            this.entityList.loaderOpen = false;
            this.entityList.loader.close();
            this.entityList.dialogService.errorReport(T("Error rolling back snapshot"), res.error);
          },
        );
      }
    });
  }

}
