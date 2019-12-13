import { Component } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { DialogService } from '../../../../app/services';
import { RestService, WebSocketService } from '../../../services';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';
import { StorageService } from '../../../services/storage.service';
import { T } from '../../../translate-marker';
import { EntityJobComponent } from '../../common/entity/entity-job/entity-job.component';
import { EntityUtils } from '../../common/entity/utils';
import { DialogFormConfiguration } from '../../common/entity/entity-dialog/dialog-form-configuration.interface';
import helptext from '../../../helptext/jails/jails-list';

@Component({
  selector: 'app-jail-list',
  template: `<entity-table [title]="title" [conf]="this" ></entity-table>`,
  providers: [DialogService, StorageService]
})
export class JailListComponent {

  public isPoolActivated: boolean;
  public selectedPool;
  public activatedPool: any;
  public availablePools: any;
  public title = "Jails";
  protected queryCall = 'jail.query';
  protected wsDelete = 'jail.do_delete';
  protected wsMultiDelete = 'core.bulk';
  public entityList;
  protected route_add = ["jails", "add", "wizard"];
  protected route_add_tooltip = "Add Jail";
  public toActivatePool: boolean = false;

  public columns: Array < any > = [
    { name: T('JID'), prop: 'jid'},
    { name: T('Name'), prop: 'host_hostuuid', always_display: true },
    { name: T('Boot'), prop: 'boot_readble', hidden: true},
    { name: T('State'), prop: 'state'},
    { name: T('Release'), prop: 'release' },
    { name: T("IPv4"), prop: 'ip4_addr', hidden: true },
    { name: T("IPv6"), prop: 'ip6_addr', hidden: true },
    { name: T("Type"), prop: 'type', hidden: true },
    { name: T("Template"), prop: 'template', hidden: true },
    { name: T("Basejail"), prop: 'basejail_readble', hidden: true }
  ];
  public rowIdentifier = 'host_hostuuid';
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
              let message = "";
              for (let i = 0; i < res.result.length; i++) {
                if (res.result[i].error != null) {
                  message = message + '<li>' + selectedJails[i] + ': ' + res.result[i].error + '</li>';
                }
              }
              if (message === "") {
                this.dialogService.Info(T('Jails Started'), T("Jails started."));
              } else {
                message = '<ul>' + message + '</ul>';
                this.dialogService.errorReport(T('Jails failed to start'), message);
              }
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
        const selectedJails = this.getSelectedNames(selected);
        this.dialogService.Info(T('Jail Update'), T('Updating selected plugins.'));
        this.entityList.busy =
          this.ws.job('core.bulk', ["jail.update_to_latest_patch", selectedJails]).subscribe(
            (res) => {
              let message = "";
              for (let i = 0; i < res.result.length; i++) {
                if (res.result[i].error != null) {
                  message = message + '<li>' + selectedJails[i] + ': ' + res.result[i].error + '</li>';
                }
              }
              if (message === "") {
                this.dialogService.Info('', T('Selected jails updated.'), '500px', 'info', true);
              } else {
                message = '<ul>' + message + '</ul>';
                this.dialogService.errorReport(T('Jail Update Failed'), message);
              }
            },
            (res) => {
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

  public showSpinner = true;

  protected globalConfig = {
    id: "config",
    tooltip: helptext.globalConfig.tooltip,
    onClick: () => {
      this.prerequisite().then((res)=>{
        if (res && this.activatedPool !== undefined) {
          this.activatePool();
        }
      })
    }
  };

  protected addBtnDisabled = true;

  constructor(public router: Router, protected rest: RestService, public ws: WebSocketService,
    public loader: AppLoaderService, public dialogService: DialogService, private translate: TranslateService,
    public sorter: StorageService, public dialog: MatDialog,) {}

  noPoolDialog() {
    const dialogRef = this.dialogService.confirm(
      helptext.noPoolDialog.title,
      helptext.noPoolDialog.message,
      true,
      helptext.noPoolDialog.buttonMsg);

      dialogRef.subscribe((res) => {
        if (res) {
          this.router.navigate(new Array('/').concat(['storage', 'pools', 'manager']));
        }
    })
  }

  prerequisite(): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      await this.ws.call('pool.query').toPromise().then((res) => {
        if (res.length === 0) {
          resolve(true);
          this.noPoolDialog();
          return;
        }
        this.availablePools = res
      }, (err) => {
        resolve(false);
        new EntityUtils().handleWSError(this.entityList, err);
      });

      if (this.availablePools !== undefined) {
        this.ws.call('jail.get_activated_pool').toPromise().then((res) => {
          resolve(true);
          if (res != null) {
            this.activatedPool = res;
            this.addBtnDisabled = false;
          } else {
            this.activatePool();
          }
        }, (err) => {
          resolve(false);
          new EntityUtils().handleWSError(this.entityList, err);
        })
      }
    });
  }

  afterInit(entityList: any) {
    this.entityList = entityList;
  }

  activatePool() {
    const self = this;

    const conf: DialogFormConfiguration = {
      title: helptext.activatePoolDialog.title,
      fieldConfig: [
        {
          type: 'select',
          name: 'selectedPool',
          placeholder: helptext.activatePoolDialog.selectedPool_placeholder,
          options: this.availablePools ? this.availablePools.map(pool => {return {label: pool.name + (pool.is_decrypted ? '' : ' (Locked)'), value: pool.name, disable: !pool.is_decrypted}}) : [],
          value: this.activatedPool
        }
      ],
      saveButtonText: helptext.activatePoolDialog.saveButtonText,
      customSubmit: function (entityDialog) {
        const value = entityDialog.formValue;
        self.entityList.loader.open();
        self.ws.call('jail.activate', [value['selectedPool']]).subscribe(
          (res)=>{
            self.addBtnDisabled = false;
            self.activatedPool = value['selectedPool'];
            entityDialog.dialogRef.close(true);
            self.entityList.loaderOpen = true;
            self.entityList.getData();
            self.dialogService.Info(
              helptext.activatePoolDialog.successInfoDialog.title,
              helptext.activatePoolDialog.successInfoDialog.message + value['selectedPool'],
              '500px', 'info', true);
          },
          (res) => {
            self.entityList.loader.close();
            new EntityUtils().handleWSError(self.entityList, res, self.dialogService);
          });
      }
    }
    if (this.availablePools) {
      this.dialogService.dialogForm(conf);
    }
  }

  getActions(parentRow) {
    return [{
        name: parentRow.host_hostuuid,
        icon: 'edit',
        id: "edit",
        label: T("Edit"),
        onClick: (row) => {
          this.router.navigate(
            new Array('').concat(["jails", "edit", row.host_hostuuid]));
        }
      },
      {
        name: parentRow.host_hostuuid,
        icon: 'device_hub',
        id: "mount",
        label: T("Mount points"),
        onClick: (row) => {
          this.router.navigate(
            //new Array('').concat(["jails", "storage", "add", row.host_hostuuid]));
            new Array('').concat(["jails", "storage", row.host_hostuuid]));
        }
      },
      {
        name: parentRow.host_hostuuid,
        icon: 'play_arrow',
        id: "start",
        label: T("Start"),
        onClick: (row) => {
          const dialogRef = this.dialog.open(EntityJobComponent, { data: { "title": T("Starting Jail") }, disableClose: true });
          dialogRef.componentInstance.setCall('jail.start', [row.host_hostuuid]);
          dialogRef.componentInstance.submit();
          dialogRef.componentInstance.success.subscribe((res) => {
            dialogRef.close(true);
            row.state = 'up';
            this.updateRow(row);
            this.updateMultiAction([row]);
          });
        }
      },
      {
        name: parentRow.host_hostuuid,
        icon: 'cached',
        id: "restart",
        label: T("Restart"),
        onClick: (row) => {
          const dialogRef = this.dialog.open(EntityJobComponent, { data: { "title": T("Restarting Jail") }, disableClose: true });
          dialogRef.componentInstance.setCall('jail.restart', [row.host_hostuuid]);
          dialogRef.componentInstance.submit();
          dialogRef.componentInstance.success.subscribe((res) => {
            dialogRef.close(true);
            row.state = 'up';
            this.updateRow(row);
            this.updateMultiAction([row]);
          });
        }
      },
      {
        name: parentRow.host_hostuuid,
        icon: 'stop',
        id: "stop",
        label: T("Stop"),
        onClick: (row) => {
          let dialog = {};
          this.dialogService.confirm("Stop", "Stop the selected jail?", 
            dialog.hasOwnProperty("hideCheckbox") ? dialog['hideCheckbox'] : true , T('Stop')).subscribe((res) => {
              const dialogRef = this.dialog.open(EntityJobComponent, { data: { "title": T("Stopping Jail") }, disableClose: true });
              dialogRef.componentInstance.setCall('jail.stop', [row.host_hostuuid]);
              dialogRef.componentInstance.submit();
              dialogRef.componentInstance.success.subscribe((res) => {
                dialogRef.close(true);
                row.state = 'down';
                this.updateRow(row);
                this.updateMultiAction([row]);
              });
          })
        }
      },
      {
        name: parentRow.host_hostuuid,
        icon: 'update',
        id: "update",
        label: T("Update"),
        onClick: (row) => {
          const dialogRef = this.dialog.open(EntityJobComponent, { data: { "title": T("Updating Jail") }, disableClose: true });
          dialogRef.componentInstance.setCall('jail.update_to_latest_patch', [row.host_hostuuid]);
          dialogRef.componentInstance.submit();
          dialogRef.componentInstance.success.subscribe((res) => {
            dialogRef.close(true);
            this.dialogService.Info(T('Jail Updated'), T("Jail <i>") + row.host_hostuuid + T("</i> updated."), '500px', 'info', true);
          });
        }
      },
      {
        name: parentRow.host_hostuuid,
        icon: 'keyboard_arrow_right',
        id: "shell",
        label: T("Shell"),
        onClick: (row) => {
          this.router.navigate(
            new Array('').concat(["jails", "shell", row.host_hostuuid]));
        }
      },
      {
        name: parentRow.host_hostuuid,
        icon: 'delete',
        id: "delete",
        label: T("Delete"),
        onClick: (row) => {
          this.entityList.doDelete(row);
        }
      }
    ]
  }
  
  public isActionVisible(actionId: string, row): boolean {
    if (actionId === "start" && row.state === "up") {
      return false;
    } else if (actionId === "stop" && row.state === "down") {
      return false;
    } else if (actionId === "shell" && row.state === "down") {
      return false;
    } else if (actionId === "restart" && row.state === "down") {
      return false;
    }

    return true;
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
     _.find(this.multiActions, {'id': 'mstop' as any})['enable'] = true;
    } else {
      _.find(this.multiActions, {'id': 'mstop' as any})['enable'] = false;
    }

    if (_.find(selected, ['state', 'down'])) {
     _.find(this.multiActions, {'id': 'mstart' as any})['enable'] = true;
    } else {
      _.find(this.multiActions, {'id': 'mstart' as any})['enable'] = false;
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
      entityList.rows[i].boot_readble =  entityList.rows[i].boot === 0 ? 'off' : 'on';
      entityList.rows[i].source_template =  entityList.rows[i].source_template  ? entityList.rows[i].source_template : '-';
      entityList.rows[i].basejail_readble =  entityList.rows[i].basejail === 0 ? 'no' : 'yes';

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
