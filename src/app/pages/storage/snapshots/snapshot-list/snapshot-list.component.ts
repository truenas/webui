import { Component, ElementRef, Injector, ApplicationRef, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { RestService } from '../../../../services/rest.service';
import { Subscription } from 'rxjs';
import { WebSocketService } from 'app/services';
import { EntityUtils } from '../../../common/entity/utils';

import { T } from '../../../../translate-marker';
import { isNgTemplate } from '@angular/compiler';
@Component({
  selector: 'app-snapshot-list',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`
})
export class SnapshotListComponent {

  public title = "Snapshots";
  protected queryCall = 'zfs.snapshot.query';
  protected queryCallOption = [[["pool", "!=", "freenas-boot"]], {"select": ["name", "properties"], "order_by": ["name"]}];
  protected route_add: string[] = ['storage', 'snapshots', 'add'];
  protected route_add_tooltip = "Add Snapshot";
  protected wsDelete = 'zfs.snapshot.remove';
  protected loaderOpen = false;
  protected entityList: any;
  public busy: Subscription;
  public sub: Subscription;
  public columns: Array<any> = [
    {name : 'Name', prop : 'name', minWidth: 355},
    {name : 'Used', prop : 'used'},
    {name : 'Referenced', prop : 'refer'},
    {name : 'Date Created', prop: 'creation'}
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
    for (let i = 0; i < rows.length; i++) {
      rows[i].used = rows[i].properties.used.rawvalue;
      rows[i].refer = rows[i].properties.referenced.rawvalue;
      rows[i].creation = rows[i].properties.creation.value;
    }
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

  getActions(parentRow) {
    const actions = [];
    
    actions.push({
      label: "Delete",
      onClick: (row1) => {
        this.doDelete(row1);
      }
    });
    actions.push({
      label: "Clone",
      onClick: (row1) => {
        this._router.navigate(new Array('/').concat(
          ["storage", "snapshots", "clone", row1.id]));
      }
    });
    actions.push({
      label: "Rollback",
      onClick: (row1) => {
        this.doRollback(row1);
      }
    });
    return actions;
  }

  getSelectedNames(selectedSnapshots) {
    let selected: any = [];
    for (let i in selectedSnapshots) {
      selected.push([{"dataset": selectedSnapshots[i].dataset, "name": selectedSnapshots[i].snapshot_name}]);
    }
    return selected;
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
        this.ws.call(this.wsDelete, [{ "dataset": item.dataset, "name": item.snapshot_name}]).subscribe(
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
    const msg = T("<br><br>Roll back to snapshot <i>") + item.snapshot_name + '</i> from ' + item.creation + '?';

    this.entityList.dialogService.confirm(T("Warning"), warningMsg + msg, false, T('Rollback')).subscribe(res => {
      let data = {"force" : true};
      if (res) {
        this.entityList.loader.open();
        this.entityList.loaderOpen = true;
        this.rest
        .post('storage/snapshot' + '/' + item.id + '/rollback/', {
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
