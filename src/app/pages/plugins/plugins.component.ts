import { Component } from '@angular/core'
import { MatDialog } from '@angular/material';
import { Router } from '@angular/router';

import * as myIP from 'what-is-my-ip-address';

import { AvailablePluginsComponent } from './available-plugins/available-plugins.component';
import { AppLoaderService, WebSocketService, DialogService } from '../../services';
import { EntityUtils } from '../common/entity/utils';
import { T } from '../../translate-marker';
import * as _ from 'lodash';
import { DialogFormConfiguration } from '../common/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityJobComponent } from '../common/entity/entity-job/entity-job.component';
import helptext from '../../helptext/plugins/plugins';

@Component({
  selector: 'app-plugins-ui',
  template:  `<entity-table [title]="title" [conf]="this"></entity-table>`,
})
export class PluginsComponent {
  public title = "Plugins";
  protected globalConfig = {
    id: "config",
    tooltip: T("Config Pool for Jail Manager"),
    onClick: () => {
      this.prerequisite().then((res)=>{
        this.activatePool();
      })
    }
  };
  protected queryCall = 'plugin.query';
  protected wsDelete = 'jail.do_delete';
  protected wsMultiDelete = 'core.bulk';
  protected entityList: any;

  public availablePools: any;
  public activatedPool: any;

  public columns: Array<any> = [
    { name: T('Jail'), prop: 'name', always_display: true },
    { name: T('Status'), prop: 'state' },
    { name: T('Admin Portal'), prop: 'admin_portal'},
    { name: T('IPv4 Address'), prop: 'ip4', hidden: true },
    { name: T('IPv6 Address'), prop: 'ip6', hidden: true },
    { name: T('Version'), prop: 'version', hidden: true },
    { name: T('Plugin'), prop: 'plugin', hidden: true },
    { name: T('Release'), prop: 'release', hidden: true },
    { name: T('Boot'), prop: 'boot', selectable: true},
    { name: T('Collection'), prop: 'plugin_repository', hidden: true },
  ];
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
    multiSelect: true,
    deleteMsg: {
      title: 'Plugin',
      key_props: ['name'],
      id_prop: 'name',
      doubleConfirm: (item) => {
        return this.dialogService.doubleConfirm(
          T('Verify Deletion of ') + item.name + T(' Plugin'),
          T('Deleting the <b>') + item.name + T('</b> plugin deletes all data and snapshots stored with it.'),
          item.name,
          true,
        );
      },
    },
  };

  protected cardHeaderComponent = AvailablePluginsComponent;

  public multiActions: Array<any> = [
    {
      id: "mstart",
      label: T("Start"),
      icon: "play_arrow",
      enable: true,
      ttpos: "above", // tooltip position
      onClick: (selected) => {
        const selectedJails = this.getSelectedNames(selected);
        this.loader.open();
        this.entityList.busy =
          this.ws.job('core.bulk', ["jail.start", selectedJails]).subscribe(
            (res) => {
              this.updateRows(selected).then(
                () => {
                  this.entityList.table.rowDetail.collapseAllRows();
                  this.updateMultiAction(selected);
                  this.loader.close();
                }
              );
            },
            (res) => {
              new EntityUtils().handleWSError(this.entityList, res, this.dialogService);
              this.loader.close();
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
        const selectedJails = this.getSelectedNames(selected);
        this.loader.open();
        this.entityList.busy =
          this.ws.job('core.bulk', ["jail.stop", selectedJails]).subscribe(
            (res) => {
              this.updateRows(selected).then(
                () => {
                  this.entityList.table.rowDetail.collapseAllRows();
                  this.updateMultiAction(selected);
                  this.loader.close();
                }
              );
            },
            (res) => {
              new EntityUtils().handleWSError(this.entityList, res, this.dialogService);
              this.loader.close();
            });
      }
    },
    {
      id: "mupupdate",
      label: T("Update"),
      icon: "update",
      enable: true,
      ttpos: "above",
      onClick: (selected) => {
        const selectedJails = this.getSelectedNames(selected);
        this.dialogService.Info(helptext.multi_update_dialog.title, helptext.multi_update_dialog.content);
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
                this.entityList.table.rowDetail.collapseAllRows();
                this.dialogService.Info(helptext.multi_update_dialog.title, helptext.multi_update_dialog.succeed);
              } else {
                message = '<ul>' + message + '</ul>';
                this.dialogService.errorReport(T('Plugin Update Failed'), message);
              }
            },
            (res) => {
              new EntityUtils().handleWSError(this.entityList, res, this.dialogService);
            });
      }
    },
    // {
    //   id: "mdelete",
    //   label: T("Delete"),
    //   icon: "delete",
    //   enable: true,
    //   ttpos: "above",
    //   onClick: (selected) => {
    //     this.entityList.doMultiDelete(selected);
    //   }
    // }
  ];

  protected publicIp = '';

  constructor(
    private loader: AppLoaderService,
    private ws: WebSocketService,
    private dialogService: DialogService,
    private router: Router,
    protected matDialog: MatDialog) {
      myIP.v4().then((pubIp) => {
        this.publicIp = pubIp;
      }).catch((e) => {
        console.log("Error getting Public IP: ", e);
        this.publicIp = '';
      });
    }

  prerequisite(): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      await this.ws.call('pool.query').toPromise().then((res) => {
        if (res.length === 0) {
          resolve(false);
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
          if (res != null) {
            this.activatedPool = res;
            resolve(true);
          } else {
            resolve(false);
            this.activatePool();
          }
        }, (err) => {
          resolve(false);
          new EntityUtils().handleWSError(this.entityList, err);
        })
      }
    });
  }

  noPoolDialog() {
    const dialogRef = this.dialogService.confirm(
      T('No Pools'),
      T('Jails cannot be created or managed until a pool is present for storing them.'),
      true,
      T('Create Pool'));

      dialogRef.subscribe((res) => {
        if (res) {
          this.router.navigate(new Array('/').concat(['storage', 'pools', 'manager']));
        }
    })
  }

  activatePool() {
    const self = this;

    const conf: DialogFormConfiguration = {
      title: T("Activate Pool for Jail Manager"),
      fieldConfig: [
        {
          type: 'select',
          name: 'selectedPool',
          placeholder: T('Choose a pool or dataset for jail storage'),
          options: this.availablePools ? this.availablePools.map(pool => {return {label: pool.name, value: pool.name}}) : [],
          value: this.activatedPool
        }
      ],
      saveButtonText: T("Activate"),
      customSubmit: function (entityDialog) {
        const value = entityDialog.formValue;
        self.entityList.loader.open();
        self.ws.call('jail.activate', [value['selectedPool']]).subscribe(
          (res)=>{
            self.activatedPool = value['selectedPool'];
            entityDialog.dialogRef.close(true);
            self.entityList.loaderOpen = true;
            self.entityList.getData();
            self.dialogService.Info(T('Pool Actived'), T("Successfully activated pool ") + value['selectedPool'], '500px', 'info', true);
          },
          (res) => {
            self.entityList.loader.close();
            new EntityUtils().handleWSError(this.entityList, res);
          });
      }
    }
    if (this.availablePools) {
      this.dialogService.dialogForm(conf);
    }
  }

  afterInit(entityList: any) {
    this.entityList = entityList;
  }

  dataHandler(entityList: any) {
    for (let i = 0; i < entityList.rows.length; i++) {
      let revision = entityList.rows[i]['revision'];
      if (revision !== 'N/A' && revision !== '0' ) {
        revision = '_' + revision;
      } else {
        revision = '';
      }
      entityList.rows[i]['version'] = entityList.rows[i]['version'] + revision;
      for (const ipType of ['ip4', 'ip6']) {
        if (entityList.rows[i][ipType] != null) {
          entityList.rows[i][ipType] = entityList.rows[i][ipType]
            .split(',')
            .map(function (e) {
              return _.split(e, '|').length > 1 ? _.split(e, '|')[1] : e;
            })
            .join(',');
        };
      };
    };
  }

  getSelectedNames(selectedJails) {
    const selected: any = [];
    for (const i in selectedJails) {
      selected.push([selectedJails[i]['name']]);
    }
    return selected;
  }

  updateRows(rows: Array<any>): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.ws.call('plugin.query').subscribe(
        (res) => {
            for (const row of rows) {
              const targetIndex = _.findIndex(res, function (o) { return o['name'] === row.name });
              if (targetIndex === -1) {
                reject(false);
              }
              for (const i in row) {
                row[i] = ((i === 'ip4' || i === 'ip6') && res[targetIndex][i] != null) ? res[targetIndex][i]
                  .split(',')
                  .map(function (e) {
                    return _.split(e, '|').length > 1 ? _.split(e, '|')[1] : e;
                  })
                  .join(',') : res[targetIndex][i];
              }
            }
            resolve(true);
        },
        (err) => {
          new EntityUtils().handleWSError(this, err, this.dialogService);
          reject(err);
        }
      )
    });
  };

  updateMultiAction(selected: any) {
    if (_.find(selected, function (plugin) { return plugin.state == 'up'; })) {
      _.find(this.multiActions, { 'id': 'mstop' as any })['enable'] = true;
    } else {
      _.find(this.multiActions, { 'id': 'mstop' as any })['enable'] = false;
    }

    if (_.find(selected, function (plugin) { return plugin.state == 'down'; })) {
      _.find(this.multiActions, { 'id': 'mstart' as any })['enable'] = true;
    } else {
      _.find(this.multiActions, { 'id': 'mstart' as any })['enable'] = false;
    }
  };

  wsMultiDeleteParams(selected: any) {
    const params: Array<any> = ['jail.do_delete'];
    params.push(this.getSelectedNames(selected));
    return params;
  }


  getActions(parentrow) {
    const actions = [{
      name: parentrow.name,
      id: "start",
      label: T("START"),
      icon: 'play_arrow',
      onClick: (row) => {
        this.loader.open();
        this.ws.job('jail.start', [row.name]).subscribe(
          (res) => {
            this.updateRows([row]).then(() => {
              this.loader.close();
            });
          },
          (res) => {
            this.loader.close();
            new EntityUtils().handleWSError(this, res, this.dialogService);
          });
      }
    },
    {
      name: parentrow.name,
      id: "restart",
      label: T("RESTART"),
      icon: 'replay',
      onClick: (row) => {
        this.loader.open();
        this.ws.job('jail.restart', [row.name]).subscribe(
          (res) => {
            this.updateRows([row]).then(() => {
              this.loader.close();
            });
          },
          (err) => {
            this.loader.close();
            new EntityUtils().handleWSError(this, err, this.dialogService);
          });
      }
    },
    {
      name: parentrow.name,
      id: "stop",
      label: T("STOP"),
      icon: 'stop',
      onClick: (row) => {
        this.loader.open();
        this.ws.job('jail.stop', [row.name]).subscribe(
          (res) => {
            this.updateRows([row]).then(() => {
              this.loader.close()
            });
          },
          (res) => {
            this.loader.close();
            new EntityUtils().handleWSError(this, res, this.dialogService);
          });
      }
    },
    {
      name: parentrow.name,
      id: "update",
      label: T("UPDATE"),
      icon: 'update',
      onClick: (row) => {
        const dialogRef = this.matDialog.open(EntityJobComponent, { data: { "title": T("Updating Plugin") }, disableClose: true });
        dialogRef.componentInstance.disableProgressValue(true);
        dialogRef.componentInstance.setCall('jail.update_to_latest_patch', [row.name]);
        dialogRef.componentInstance.submit();
        dialogRef.componentInstance.success.subscribe((res) => {
          dialogRef.close(true);
          this.dialogService.Info(T('Plugin Updated'), T("Plugin ") + row.name + T(" updated."));
        });
      }
    },
    {
      name: parentrow.name,
      id: "management",
      label: T("MANAGE"),
      icon: 'settings',
      onClick: (row) => {
        window.open(row.admin_portal);
      }
    },
    {
      name: parentrow.name,
      id: "delete",
      label: T("UNINSTALL"),
      icon: 'delete',
      onClick: (row) => {
        this.entityList.doDelete(row);
      }
    }];

    if (parentrow.plugin === 'asigra') {
      actions.push({
        name: parentrow.name,
        id: "register",
        label: T('REGISTER'),
        icon: 'assignment',
        onClick: (row) => {
          this.getRegistrationLink();
        }
      });
    }
    if (parentrow.plugin_info) {
      actions.push({
        name: parentrow.name,
        id: "postinstall",
        label: T('POST INSTALL NOTES'),
        icon: 'description',
        onClick: (row) => {
          let install_notes = '';
          for (const msg of row.plugin_info.split('\n')) {
            install_notes += '<p>' + msg + '</p>';
          }
          this.dialogService.Info(T('Post Install Notes'), install_notes, '500px', 'description', true);
        }
      });
    }
    if (parentrow.doc_url) {
      actions.push({
        name: parentrow.name,
        id: "docurl",
        label: T('DOCUMENTATION'),
        icon: 'info',
        onClick: (row) => {
          window.open(row.doc_url);
        }
      });
    }
    return actions;
  }

  isActionVisible(actionId: string, row: any) {
    if (actionId === 'start' && row.state === "up") {
      return false;
    } else if (actionId === 'stop' && row.state === "down") {
      return false;
    } else if (actionId === 'management' && (row.state === "down" || row.admin_portal == null)) {
      return false;
    } else if (actionId === 'restart' && row.state === "down") {
      return false;
    }
    return true;
  }

  getRegistrationLink() {
    const url = 'https://licenseportal.asigra.com/licenseportal/user-registration.do';
    const form = document.createElement('form');
    form.action = url;
    form.method = 'POST';
    form.target = '_blank';
    form.style.display = 'none';

    const input = document.createElement('input');
    input.type = 'text';
    input.name = 'dsSystemPublicIP';
    input.value = this.publicIp;

    const submit = document.createElement('input');
    submit.type = 'submit';
    submit.id = 'submitProject';

    form.appendChild(input);
    form.appendChild(submit);
    document.body.appendChild(form);

    submit.click();

    document.body.removeChild(form);
  }

  wsDeleteParams(row, id) {
    return row.state === 'up' ? [id, {force: true}] : [id];
  }

  resourceTransformIncomingRestData(data) {
    return data.map(plugin =>  {
      plugin['boot'] = plugin['boot'] === 'on' ? true : false;
      return plugin;
    });
  }

  onCheckboxChange(row) {
    this.loader.open();
    row.boot = !row.boot;
    this.ws.call('plugin.update', [row.id, {'boot': row.boot ? 'on' : 'off'}] )
    .subscribe(
      (res) => {
        if (!res) {
          row.boot = !row.boot;
        }
        this.loader.close();
      },
      (err) => {
        this.loader.close();
        new EntityUtils().handleWSError(this, err, this.dialogService);
      });
  }
}
