import { Component } from '@angular/core'
import { MatSnackBar } from '@angular/material';
import { Router } from '@angular/router';

import { AvailablePluginsComponent } from './available-plugins/available-plugins.component';
import { PluginComponent } from './plugin/plugin.component';
import { AppLoaderService, WebSocketService } from '../../services';
import { EntityUtils } from '../common/entity/utils';
import { DialogService } from '../../../app/services';
import { T } from '../../translate-marker';
import * as _ from 'lodash';
import { DialogFormConfiguration } from '../common/entity/entity-dialog/dialog-form-configuration.interface';

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
    { name: T('IPv4 Address'), prop: 'ip4' },
    { name: T('IPv6 Address'), prop: 'ip6' },
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
          T('To delete the <b>') + item.name + T('</b> plugin and all data and snapshots stored with it, please type the name of the plugin to confirm:'),
          item.name
        );
      },
    },
  };
  protected columnFilter = false;
  protected cardHeaderComponent = AvailablePluginsComponent;
  protected showActions = false;
  protected hasDetails = true;
  protected rowDetailComponent = PluginComponent;

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

        this.snackBar.open(T('Updating selected plugins.'), 'close', { duration: 5000 });
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
                this.snackBar.open(T('Selected plugins updated.'), 'close', { duration: 5000 });
              } else {
                message = '<ul>' + message + '</ul>';
                this.dialogService.errorReport(T('Plugin Update Failed'), message);
              }
            },
            (res) => {
              this.snackBar.open(T('Updating selected plugins failed.'), 'close', { duration: 5000 });
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

  constructor(
    private loader: AppLoaderService,
    private ws: WebSocketService,
    private dialogService: DialogService,
    private snackBar: MatSnackBar,
    private router: Router) {
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
      T('No Pool Exist'),
      T('Jails cannot be created or managed untill a pool is present for storing them. Please create a pool first'),
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
          options: this.availablePools.map(pool => {return {label: pool.name, value: pool.name}}),
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

            self.snackBar.open("Successfully activate pool " + value['selectedPool'] , 'close', { duration: 5000 });
          },
          (res) => {
            self.entityList.loader.close();
            new EntityUtils().handleWSError(this.entityList, res);
          });
      }
    }
    this.dialogService.dialogForm(conf);
  }

  afterInit(entityList: any) {
    this.entityList = entityList;
  }

  dataHandler(entityList: any) {
    for (let i = 0; i < entityList.rows.length; i++) {
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
}
