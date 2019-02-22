import { RestService, WebSocketService } from '../../../services';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';
import { StorageService } from '../../../services/storage.service'
import { EntityUtils } from '../../common/entity/utils';
import { TranslateService } from '@ngx-translate/core';
import { DialogService } from '../../../../app/services';
import { T } from '../../../translate-marker';
import { MatSnackBar } from '@angular/material';


@Component({
  selector: 'app-jail-list',
  // template: `<entity-table [title]="title" [conf]="this"></entity-table>`
  templateUrl: './jail-list.component.html',
  styleUrls: ['../../plugins/plugins-available/plugins-available-list.component.css'],
  providers: [DialogService, StorageService]
})
export class JailListComponent implements OnInit {

  public isPoolActivated: boolean;
  public selectedPool;
  public activatedPool: any;
  public availablePools: any;
  public title = "Jails";
  protected queryCall = 'jail.query';
  protected wsDelete = 'jail.do_delete';
  protected wsMultiDelete = 'core.bulk';
  protected entityList: any;
  protected route_add = ["jails", "add", "wizard"];
  protected route_add_tooltip = "Add Jail";
  public toActivatePool: boolean = false;
  public legacyWarning = T("Note: Legacy jails created before FreeNAS 11.2 must be managed from the");
  public legacyWarningLink = T("legacy web interface");

  public columns: Array < any > = [
    { name: T('Jail'), prop: 'host_hostuuid', always_display: true },
    { name: T('IPv4 Address'), prop: 'ip4_addr' },
    { name: T('IPv6 Address'), prop: 'ip6_addr' },
    { name: T('Status'), prop: 'state' },
    { name: T('Type'), prop: 'type', hidden: true, minWidth: 80, maxWidth: 120 },
    { name: T('Release'), prop: 'release', minWidth: 225, maxWidth: 325 },
  ];
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
    multiSelect: true,
    deleteMsg: {
      title: 'Jail',
      key_props: ['host_hostuuid'],
      id_prop: 'host_hostuuid'
    },
  };
  public multiActions: Array < any > = [{
      id: "mstart",
      label: T("Start"),
      icon: "play_arrow",
      enable: true,
      ttpos: "above", // tooltip position
      onClick: (selected) => {
        let selectedJails = this.getSelectedNames(selected);
        this.loader.open();
        this.entityList.busy =
          this.ws.job('core.bulk', ["jail.start", selectedJails]).subscribe(
            (res) => {
              for (let i in selected) {
                selected[i].state = 'up';
                this.updateRow(selected[i]);
              }
              this.updateMultiAction(selected);
              this.loader.close();
            },
            (res) => {
              this.loader.close();
              new EntityUtils().handleWSError(this.entityList, res, this.dialogService);
            });
      }
    },
    {
      id: "mstop",
      label: T("Stop"),
      icon: "stop",
      enable: true,
      ttpos: "above",
      onClick: (selected) => {
        let dialog = {};
        this.dialogService.confirm("Stop", "Stop the selected jails?",
          dialog.hasOwnProperty("hideCheckbox") ? dialog['hideCheckbox'] : true, T('Stop')).subscribe((res) => {
          if (res) {
            let selectedJails = this.getSelectedNames(selected);
            this.loader.open();
            this.entityList.busy =
              this.ws.job('core.bulk', ["jail.stop", selectedJails]).subscribe(
                (res) => {
                  for (let i in selected) {
                    selected[i].state = 'down';
                    this.updateRow(selected[i]);
                  }
                  this.updateMultiAction(selected);
                  this.loader.close();
                },
                (res) => {
                  this.loader.close();
                  new EntityUtils().handleWSError(this.entityList, res, this.dialogService);
                });
          }
        })
      }
    },
    {
      id: "mupdate",
      label: T("Update"),
      icon: "update",
      enable: true,
      ttpos: "above",
      onClick: (selected) => {
        let selectedJails = this.getSelectedNames(selected);
        this.loader.open();
        this.entityList.busy =
          this.ws.job('core.bulk', ["jail.update_to_latest_patch", selectedJails]).subscribe(
            (res) => {
              this.loader.close();
              if (res.state == 'SUCCESS') {
                this.snackBar.open(T("Selected Jail(s) updated successfully."), T("Close"), { duration: 5000 });
              } else {
                new EntityUtils().handleWSError(this.entityList, res, this.dialogService);
              }
            },
            (res) => {
              this.loader.close();
              new EntityUtils().handleWSError(this.entityList, res, this.dialogService);
            });
      }
    },
    {
      id: "mdelete",
      label: T("Delete"),
      icon: "delete",
      enable: true,
      ttpos: "above",
      onClick: (selected) => {
        this.entityList.doMultiDelete(selected);
      }
    },
  ];

  public tooltipMsg: any = T("Choose a pool where the iocage jail manager \
  can create the /iocage dataset. The /iocage \
  dataset might not be visible until after \
  the first jail is created. iocage uses \
  this dataset to store FreeBSD releases \
  and all other jail data.");

  constructor(protected router: Router, protected rest: RestService, protected ws: WebSocketService, 
    protected loader: AppLoaderService, protected dialogService: DialogService, private translate: TranslateService,
    protected snackBar: MatSnackBar, public sorter: StorageService) {}


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
    } if (actionId === 'restart' && row.state === "down") {
      return false;
    }
    return true;
  }

  getActivatedPool(){
    this.ws.call('jail.get_activated_pool').subscribe(
      (res)=>{
        if (res != null && res != "") {
          this.activatedPool = res;
          this.selectedPool = res;
          this.isPoolActivated = true;
        } else {
          this.isPoolActivated = false;
        }
      },
      (err)=>{
        new EntityUtils().handleWSError(this.entityList, err, this.dialogService);
      })
  }

  getAvailablePools(){
    this.ws.call('pool.query').subscribe( (res)=> {
      this.availablePools = res;
    })
  }

  activatePool(event: Event){
    this.loader.open();
    this.ws.call('jail.activate', [this.selectedPool]).subscribe(
      (res)=>{
        this.loader.close();
        this.isPoolActivated = true;
        this.activatedPool = this.selectedPool;
        if (this.toActivatePool) {
          this.entityList.getData();
        }
        this.entityList.snackBar.open("Successfully activate pool " + this.selectedPool , 'close', { duration: 5000 });
      },
      (res) => {
        new EntityUtils().handleWSError(this.entityList, res, this.dialogService);
      });
  }
  getActions(parentRow) {
    return [{
        id: "edit",
        label: T("Edit"),
        onClick: (row) => {
          this.router.navigate(
            new Array('').concat(["jails", "edit", row.host_hostuuid]));
        }
      },
      {
        id: "mount",
        label: T("Mount points"),
        onClick: (row) => {
          this.router.navigate(
            //new Array('').concat(["jails", "storage", "add", row.host_hostuuid]));
            new Array('').concat(["jails", "storage", row.host_hostuuid]));
        }
      },
      {
        id: "start",
        label: T("Start"),
        onClick: (row) => {
          this.entityList.busy =
            this.loader.open();
            this.ws.call('jail.start', [row.host_hostuuid]).subscribe(
              (res) => {
                row.state = 'up';
                this.updateRow(row);
                this.updateMultiAction([row]);
                this.loader.close();
              },
              (res) => {
                this.loader.close();
                new EntityUtils().handleWSError(this.entityList, res, this.dialogService);
              });
        }
      },
      {
        id: "restart",
        label: T("Restart"),
        onClick: (row) => {
          this.entityList.busy =
            this.loader.open();
            row.state = 'restarting';
            this.ws.call('jail.stop', [row.host_hostuuid]).subscribe(
              (res) => {
                this.ws.call('jail.start', [row.host_hostuuid]).subscribe(
                  (res) => {
                    row.state = 'up';
                    this.updateRow(row);
                    this.updateMultiAction([row]);
                    this.loader.close();
                  },
                  (res) => {
                    this.loader.close();
                    new EntityUtils().handleWSError(this.entityList, res, this.dialogService);
                  });
              },
              (res) => {
                this.loader.close();
                new EntityUtils().handleWSError(this.entityList, res, this.dialogService);
              });
        }
      },
      {
        id: "stop",
        label: T("Stop"),
        onClick: (row) => {
          let dialog = {};
          this.dialogService.confirm("Stop", "Stop the selected jails?", 
            dialog.hasOwnProperty("hideCheckbox") ? dialog['hideCheckbox'] : true , T('Stop')).subscribe((res) => {
            if (res) {
              this.loader.open();
              this.entityList.busy =
                this.ws.call('jail.stop', [row.host_hostuuid]).subscribe(
                  (res) => {
                    row.state = 'down';
                    this.updateRow(row);
                    this.updateMultiAction([row]);
                    this.loader.close();
                  },
                  (res) => {
                    this.loader.close();
                    new EntityUtils().handleWSError(this.entityList, res, this.dialogService);
                  });
            }
          })
        }
      },
      {
        id: "update",
        label: T("Update"),
        onClick: (row) => {
          this.loader.open();
          this.entityList.busy =
            this.ws.job('jail.update_to_latest_patch', [row.host_hostuuid]).subscribe(
              (res) => {
                this.loader.close();
                if (res.state == 'SUCCESS') {
                  this.snackBar.open(T("Jail updated successfully."), T("Close"), { duration: 5000 });
                } else {
                  new EntityUtils().handleWSError(this.entityList, res, this.dialogService);
                }
              },
              (res) => {
                this.loader.close();
                new EntityUtils().handleWSError(this.entityList, res, this.dialogService);
              });
        }
      },
      {
        id: "shell",
        label: T("Shell"),
        onClick: (row) => {
          this.router.navigate(
            new Array('').concat(["jails", "shell", row.host_hostuuid]));
        }
      },
      {
        id: "delete",
        label: T("Delete"),
        onClick: (row) => {
          this.entityList.doDelete(row);
        }
      }
    ]
  }

  getSelectedNames(selectedJails) {
    let selected: any = [];
    for (let i in selectedJails) {
      selected.push([selectedJails[i].host_hostuuid]);
    }
    return selected;
  }

  updateRow(row) {
    this.ws.call(this.queryCall, [[["host_hostuuid", "=", row.host_hostuuid]]]).subscribe(
      (res) => {
        if (res[0]) {
          const prefix = (res[0].state === 'up' && res[0].dhcp === 'on') ? 'DHCP: ' : '';
          for (let i in this.columns) {
            if (this.columns[i].prop == 'ip4_addr' && _.split(res[0].ip4_addr, '|').length > 1) {
              row.ip4_addr = prefix + _.split(res[0].ip4_addr, '|')[1];
            } else {
              row[this.columns[i].prop] = res[0][this.columns[i].prop];
            }
          }
        }
      });
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

  dataHandler(entityList: any) {
    // Call sort on load to make sure initial sort is by Jail name, asecnding
    entityList.rows = this.sorter.tableSorter(entityList.rows, 'host_hostuuid', 'asc');
    for (let i = 0; i < entityList.rows.length; i++) {
      const prefix = (entityList.rows[i].state === 'up' && entityList.rows[i].dhcp === 'on') ? 'DHCP: ' : '';
      if (_.split(entityList.rows[i].ip4_addr, '|').length > 1) {
        entityList.rows[i].ip4_addr = prefix + _.split(entityList.rows[i].ip4_addr, '|')[1];
      }
      if (entityList.rows[i].ip6_addr == 'vnet0|accept_rtadv') {
        entityList.rows[i].ip6_addr = 'Auto';
      }
    }
  }

}
