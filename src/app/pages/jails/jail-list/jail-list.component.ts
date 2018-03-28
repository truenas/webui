import { RestService, WebSocketService } from '../../../services';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';
import { EntityUtils } from '../../common/entity/utils';
import { TranslateService } from '@ngx-translate/core'

@Component({
  selector: 'app-jail-list',
  // template: `<entity-table [title]="title" [conf]="this"></entity-table>`
  templateUrl: './jail-list.component.html' 
})
export class JailListComponent implements OnInit {

  public isPoolActivated: boolean = false;
  public selectedPool;
  public activatedPool: any;
  public availablePools;
  public title = "Instances";
  protected queryCall = 'jail.query';
  protected wsDelete = 'jail.do_delete';
  protected wsMultiDelete = 'core.bulk';
  protected entityList: any;

  public columns: Array < any > = [
    { name: 'Jail', prop: 'host_hostuuid' },
    { name: 'IPv4 Address', prop: 'ip4_addr' },
    { name: 'IPv6 Address', prop: 'ip6_addr' },
    { name: 'Status', prop: 'state' },
    { name: 'Type', prop: 'type' },
    { name: 'Release', prop: 'release' },
  ];
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
    multiSelect: true,
  };
  public multiActions: Array < any > = [{
      id: "mstart",
      label: "Start",
      enable: true,
      onClick: (selected) => {
        let selectedJails = this.getSelectedNames(selected);
        this.loader.open();
        this.entityList.busy =
          this.ws.job('core.bulk', ["jail.start", selectedJails]).subscribe(
            (res) => {
              for (let i in selected) {
                selected[i].state = 'up';
              }
              this.updateMultiAction(selected);
              this.loader.close();
            },
            (res) => {
              this.loader.close();
              new EntityUtils().handleError(this, res);
            });
      }
    },
    {
      id: "mstop",
      label: "Stop",
      enable: true,
      onClick: (selected) => {
        let selectedJails = this.getSelectedNames(selected);
        this.loader.open();
        this.entityList.busy =
          this.ws.job('core.bulk', ["jail.stop", selectedJails]).subscribe(
            (res) => {
              for (let i in selected) {
                selected[i].state = 'down';
              }
              this.updateMultiAction(selected);
              this.loader.close();
            },
            (res) => {
              this.loader.close();
              new EntityUtils().handleError(this, res);
            });
      }
    },
    {
      id: "mupdate",
      label: "Update",
      enable: true,
      onClick: (selected) => {
        let selectedJails = this.getSelectedNames(selected);
        this.loader.open();
        this.entityList.busy =
          this.ws.job('core.bulk', ["jail.update_to_latest_patch", selectedJails]).subscribe(
            (res) => {
              this.loader.close();
            },
            (res) => {
              this.loader.close();
              new EntityUtils().handleError(this, res);      
            });
      }
    },
    {
      id: "mdelete",
      label: "Delete",
      enable: true,
      onClick: (selected) => {
        this.entityList.doMultiDelete(selected);
      }
    },
  ];
  constructor(protected router: Router, protected rest: RestService, protected ws: WebSocketService, protected loader: AppLoaderService) {}

  ngOnInit(){
    this.getActivatedPool();
    this.getAvailablePools();
  }
  afterInit(entityList: any) {
    this.entityList = entityList; 
  }

  isActionVisible(actionId: string, row: any) {
    if (actionId === 'start' && row.state === "up") {
      return false;
    } else if (actionId === 'stop' && row.state === "down") {
      return false;
    } else if (actionId === 'shell' && row.state === "down") {
      return false;
    }
    return true;
  }

  getActivatedPool(){
    this.ws.call('jail.get_activated_pool').subscribe((res)=>{
      if (res != null) {
        this.activatedPool = res;
        this.isPoolActivated = true;
      }
    })
  }

  getAvailablePools(){
    this.ws.call('pool.query').subscribe( (res)=> {
      this.availablePools = res;
    })
  }

  activatePool(){
    console.log(this.selectedPool);
    if (this.selectedPool!=null) {
      this.ws.call('jail.activate', [this.selectedPool.name]).subscribe(res=>{
        console.log(res);
      });
    }   
    this.isPoolActivated = true;
  }
  getActions(parentRow) {
    return [{
        id: "edit",
        label: "Edit",
        onClick: (row) => {
          this.router.navigate(
            new Array('').concat(["jails", "edit", row.host_hostuuid]));
        }
      },
      {
        id: "mount",
        label: "Mount points",
        onClick: (row) => {
          this.router.navigate(
            //new Array('').concat(["jails", "storage", "add", row.host_hostuuid]));
            new Array('').concat(["jails", "storage", row.host_hostuuid]));
        }
      },
      {
        id: "start",
        label: "Start",
        onClick: (row) => {
          this.entityList.busy =
            this.ws.call('jail.start', [row.host_hostuuid]).subscribe(
              (res) => { row.state = 'up'; },
              (res) => {
                new EntityUtils().handleError(this, res);
              });
        }
      },
      {
        id: "stop",
        label: "Stop",
        onClick: (row) => {
          this.entityList.busy =
            this.ws.call('jail.stop', [row.host_hostuuid]).subscribe(
              (res) => { row.state = 'down'; },
              (res) => {
                new EntityUtils().handleError(this, res);
              });
        }
      },
      {
        id: "update",
        label: "Update",
        onClick: (row) => {
          this.loader.open();
          this.entityList.busy =
            this.ws.job('jail.update_to_latest_patch', [row.host_hostuuid]).subscribe(
              (res) => {
                this.loader.close();
              },
              (res) => {
                this.loader.close();
                new EntityUtils().handleError(this, res);
              });
        }
      },
      {
        id: "shell",
        label: "Shell",
        onClick: (row) => {
          this.router.navigate(
            new Array('').concat(["jails", "shell", row.host_hostuuid]));
        }
      },
      {
        id: "delete",
        label: "Delete",
        onClick: (row) => {
          this.entityList.doDelete(row.host_hostuuid);
        }
      }
    ]
  }

  getAddActions() {
    return [{
        label: 'Add Jail',
        icon: 'add',
        onClick: () => {
          this.router.navigate(
            new Array('').concat(["jails", "add"]));
        }
      },{
        label: "Jail Wizard",
        icon: "beach_access",
        onClick: () => {
          this.router.navigate(
            new Array('').concat(["jails", "wizard"]));
        }
      }]
  }

  getSelectedNames(selectedJails) {
    let selected: any = [];
    for (let i in selectedJails) {
      selected.push([selectedJails[i].host_hostuuid]);
    }
    return selected;
  }

  updateMultiAction(selected: any) {
    if (_.find(selected, ['state', 'up'])) {
     _.find(this.multiActions, {'id': 'mstop'})['enable'] = true;
    } else {
      _.find(this.multiActions, {'id': 'mstop'})['enable'] = false;
    }

    if (_.find(selected, ['state', 'down'])) {
     _.find(this.multiActions, {'id': 'mstart'})['enable'] = true;
    } else {
      _.find(this.multiActions, {'id': 'mstart'})['enable'] = false;
    }
  }

  wsMultiDeleteParams(selected: any) {
    let params: Array<any> = ['jail.do_delete'];
    params.push(this.getSelectedNames(selected));
    return params;
  }
}
