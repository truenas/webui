import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { EntityTableAction, InputTableConf } from 'app/pages/common/entity/entity-table/entity-table.component';

import * as myIP from 'what-is-my-ip-address';

import { AvailablePluginsComponent } from './available-plugins/available-plugins.component';
import { AppLoaderService, WebSocketService, DialogService } from '../../services';
import { EntityUtils } from '../common/entity/utils';
import { T } from '../../translate-marker';
import * as _ from 'lodash';
import { DialogFormConfiguration } from '../common/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityJobComponent } from '../common/entity/entity-job/entity-job.component';
import helptext from '../../helptext/plugins/plugins';
import jailHelptext from '../../helptext/jails/jails-list';

@Component({
  selector: 'app-plugins-ui',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
})
export class PluginsComponent implements InputTableConf {
  title = 'Plugins';
  globalConfig = {
    id: 'config',
    tooltip: jailHelptext.globalConfig.tooltip,
    onClick: () => {
      this.getActivatedPollInfo().then((res) => {
        if (this.availablePools !== undefined) {
          this.activatePool();
        }
      });
    },
  };
  queryCall = 'plugin.query';
  wsDelete = 'jail.delete';
  wsMultiDelete = 'core.bulk';
  protected entityList: any;

  availablePools: any;
  activatedPool: any;

  autoFillWindowHeight = true;

  columns: any[] = [
    {
      name: T('Jail'), prop: 'name', always_display: true, icon: 'icon',
    },
    { name: T('Status'), prop: 'state' },
    { name: T('Admin Portals'), prop: 'admin_portals' },
    { name: T('IPv4 Address'), prop: 'ip4', hidden: true },
    { name: T('IPv6 Address'), prop: 'ip6', hidden: true },
    { name: T('Version'), prop: 'version', hidden: true },
    { name: T('Plugin'), prop: 'plugin', hidden: true },
    { name: T('Release'), prop: 'release', hidden: true },
    { name: T('Boot'), prop: 'boot', selectable: true },
    { name: T('Collection'), prop: 'plugin_repository', hidden: true },
  ];
  config: any = {
    paging: true,
    sorting: { columns: this.columns },
    multiSelect: true,
    deleteMsg: {
      title: 'Plugin',
      key_props: ['name'],
      id_prop: 'name',
      doubleConfirm: (item) => this.dialogService.doubleConfirm(
        T('Verify Deletion of ') + item.name + T(' Plugin'),
        T('Deleting the <b>') + item.name + T('</b> plugin deletes all data and snapshots stored with it.'),
        item.name,
        true,
      ),
    },
  };

  cardHeaderComponent = AvailablePluginsComponent;
  protected availablePlugins;
  protected allPlugins;

  multiActions: any[] = [
    {
      id: 'mstart',
      label: T('Start'),
      icon: 'play_arrow',
      enable: true,
      ttpos: 'above', // tooltip position
      onClick: (selected) => {
        const selectedJails = this.getSelectedNames(selected);
        this.loader.open();
        this.entityList.busy = this.ws.job('core.bulk', ['jail.start', selectedJails]).subscribe(
          (res) => {
            this.updateRows(selected).then(
              () => {
                this.entityList.table.rowDetail.collapseAllRows();
                this.updateMultiAction(selected);
                this.loader.close();
              },
            );
          },
          (res) => {
            new EntityUtils().handleWSError(this.entityList, res, this.dialogService);
            this.loader.close();
          },
        );
      },
    },
    {
      id: 'mstop',
      label: T('Stop'),
      icon: 'stop',
      enable: true,
      ttpos: 'above',
      onClick: (selected) => {
        const selectedJails = this.getSelectedNames(selected);
        this.loader.open();
        this.entityList.busy = this.ws.job('core.bulk', ['jail.stop', selectedJails]).subscribe(
          (res) => {
            this.updateRows(selected).then(
              () => {
                this.entityList.table.rowDetail.collapseAllRows();
                this.updateMultiAction(selected);
                this.loader.close();
              },
            );
          },
          (res) => {
            new EntityUtils().handleWSError(this.entityList, res, this.dialogService);
            this.loader.close();
          },
        );
      },
    },
    {
      id: 'mupupdate',
      label: T('Update'),
      icon: 'update',
      enable: true,
      ttpos: 'above',
      onClick: (selected) => {
        const self = this;
        const conf: DialogFormConfiguration = {
          title: T('Update plugins'),
          fieldConfig: [
            {
              type: 'checkbox',
              name: 'update_jail',
              placeholder: T('Update jails as well'),
            },
          ],
          confirmCheckbox: true,
          saveButtonText: T('Update'),
          customSubmit(entityDialog) {
            entityDialog.dialogRef.close(true);
            const selectedJails = self.getSelectedNamesWithChecks(selected, !!entityDialog.formValue.update_jail);
            self.dialogService.report(helptext.multi_update_dialog.title, helptext.multi_update_dialog.content, '500px', 'info');
            self.entityList.busy = self.ws.job('core.bulk', ['plugin.update_plugin', selectedJails]).subscribe(
              (res) => {
                let message = '';
                for (let i = 0; i < res.result.length; i++) {
                  if (res.result[i].error != null) {
                    message = message + '<li>' + selectedJails[i] + ': ' + res.result[i].error + '</li>';
                  }
                }
                self.updateRows(selected).then(() => {
                  if (message === '') {
                    self.entityList.table.rowDetail.collapseAllRows();
                    self.dialogService.report(helptext.multi_update_dialog.title, helptext.multi_update_dialog.succeed, '500px', 'info');
                  } else {
                    message = '<ul>' + message + '</ul>';
                    self.dialogService.errorReport(T('Plugin Update Failed'), message);
                  }
                });
              },
              (res) => {
                new EntityUtils().handleWSError(self.entityList, res, self.dialogService);
              },
            );
          },
        };
        this.dialogService.dialogForm(conf);
      },
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
    protected matDialog: MatDialog,
  ) {
    myIP.v4().then((pubIp) => {
      this.publicIp = pubIp;
    }).catch((e) => {
      console.log('Error getting Public IP: ', e);
      this.publicIp = '';
    });
  }

  preInit() {
    this.getActivatedPollInfo();
  }

  getActivatedPollInfo(): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      await this.ws.call('pool.query').toPromise().then((res) => {
        if (res.length === 0) {
          resolve(true);
          this.noPoolDialog();
          return;
        }
        this.availablePools = res;
      }, (err) => {
        resolve(false);
        new EntityUtils().handleWSError(this.entityList, err, this.dialogService);
      });

      if (this.availablePools !== undefined) {
        this.ws.call('jail.get_activated_pool').toPromise().then((res) => {
          resolve(true);
          if (res != null) {
            this.activatedPool = res;
          } else {
            this.activatePool();
          }
        }, (err) => {
          this.dialogService.errorReport(err.trace.class, err.reason, err.trace.formatted).subscribe(
            (res) => {
              resolve(false);
            },
          );
        });
      }
    });
  }

  noPoolDialog() {
    const dialogRef = this.dialogService.confirm(
      jailHelptext.noPoolDialog.title,
      jailHelptext.noPoolDialog.message,
      true,
      jailHelptext.noPoolDialog.buttonMsg,
    );

    dialogRef.subscribe((res) => {
      if (res) {
        this.router.navigate(new Array('/').concat(['storage', 'pools', 'manager']));
      }
    });
  }

  activatePool() {
    const self = this;

    const conf: DialogFormConfiguration = {
      title: jailHelptext.activatePoolDialog.title,
      fieldConfig: [
        {
          type: 'select',
          name: 'selectedPool',
          placeholder: jailHelptext.activatePoolDialog.selectedPool_placeholder,
          options: this.availablePools ? this.availablePools.map((pool) => ({
            label: pool.name + (pool.is_decrypted ? (pool.status === 'ONLINE' ? '' : ` (${pool.status})`) : ' (Locked)'),
            value: pool.name,
            disable: !pool.is_decrypted || pool.status !== 'ONLINE',
          })) : [],
          value: this.activatedPool,
        },
      ],
      saveButtonText: jailHelptext.activatePoolDialog.saveButtonText,
      customSubmit(entityDialog) {
        const value = entityDialog.formValue;
        self.entityList.loader.open();
        self.ws.call('jail.activate', [value['selectedPool']]).subscribe(
          (res) => {
            self.activatedPool = value['selectedPool'];
            entityDialog.dialogRef.close(true);
            self.entityList.loaderOpen = true;
            self.entityList.getData();
            self.dialogService.report(
              jailHelptext.activatePoolDialog.successInfoDialog.title,
              jailHelptext.activatePoolDialog.successInfoDialog.message + value['selectedPool'],
              '500px', 'info', true,
            );
          },
          (res) => {
            self.entityList.loader.close();
            new EntityUtils().handleWSError(self.entityList, res, self.dialogService);
          },
        );
      },
    };
    if (this.availablePools) {
      this.dialogService.dialogForm(conf);
    }
  }

  prerequisiteFailedHandler(entityList) {
    this.entityList = entityList;
  }

  afterInit(entityList: any) {
    this.entityList = entityList;
  }

  dataHandler(entityList: any) {
    for (let i = 0; i < entityList.rows.length; i++) {
      let revision = entityList.rows[i]['revision'];
      if (revision !== 'N/A' && revision !== '0') {
        revision = '_' + revision;
      } else {
        revision = '';
      }
      entityList.rows[i]['version'] = entityList.rows[i]['version'] + revision;
      for (const ipType of ['ip4', 'ip6']) {
        if (entityList.rows[i][ipType] != null) {
          entityList.rows[i][ipType] = entityList.rows[i][ipType]
            .split(',')
            .map((e) => (_.split(e, '|').length > 1 ? _.split(e, '|')[1] : e))
            .join(',');
        }
      }
    }
  }

  getSelectedNames(selectedJails) {
    const selected: any = [];
    for (const i in selectedJails) {
      selected.push([selectedJails[i]['name']]);
    }
    return selected;
  }

  getSelectedNamesWithChecks(selectedJails, check: boolean) {
    const selected: any = [];
    for (const i in selectedJails) {
      selected.push([selectedJails[i]['name'], check]);
    }
    return selected;
  }

  updateRows(rows: any[]): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.ws.call('plugin.query').subscribe(
        (res) => {
          for (const row of rows) {
            const targetIndex = _.findIndex(res, (o) => o['name'] === row.name);
            if (targetIndex === -1) {
              reject(false);
            }
            for (const i in row) {
              row[i] = ((i === 'ip4' || i === 'ip6') && res[targetIndex][i] != null) ? res[targetIndex][i]
                .split(',')
                .map((e) => (_.split(e, '|').length > 1 ? _.split(e, '|')[1] : e))
                .join(',') : (i === 'boot' ? (res[targetIndex][i] === 'on') : res[targetIndex][i]);
            }
          }
          resolve(true);
        },
        (err) => {
          new EntityUtils().handleWSError(this, err, this.dialogService);
          reject(err);
        },
      );
    });
  }

  updateMultiAction(selected: any) {
    if (_.find(selected, (plugin) => plugin.state == 'up')) {
      _.find(this.multiActions, { id: 'mstop' as any })['enable'] = true;
    } else {
      _.find(this.multiActions, { id: 'mstop' as any })['enable'] = false;
    }

    if (_.find(selected, (plugin) => plugin.state == 'down')) {
      _.find(this.multiActions, { id: 'mstart' as any })['enable'] = true;
    } else {
      _.find(this.multiActions, { id: 'mstart' as any })['enable'] = false;
    }
  }

  wsMultiDeleteParams(selected: any) {
    const params: any[] = ['jail.delete'];
    params.push(this.getSelectedNames(selected));
    return params;
  }

  getActions(parentrow): EntityTableAction[] {
    const actions = [{
      name: parentrow.name,
      id: 'start',
      label: T('START'),
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
          },
        );
      },
    },
    {
      name: parentrow.name,
      id: 'restart',
      label: T('RESTART'),
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
          },
        );
      },
    },
    {
      name: parentrow.name,
      id: 'stop',
      label: T('STOP'),
      icon: 'stop',
      onClick: (row) => {
        this.loader.open();
        this.ws.job('jail.stop', [row.name]).subscribe(
          (res) => {
            this.updateRows([row]).then(() => {
              this.loader.close();
            });
          },
          (res) => {
            this.loader.close();
            new EntityUtils().handleWSError(this, res, this.dialogService);
          },
        );
      },
    },
    {
      name: parentrow.name,
      id: 'update',
      label: T('UPDATE'),
      icon: 'update',
      onClick: (row) => {
        const self = this;
        const conf: DialogFormConfiguration = {
          title: T('Update plugin'),
          fieldConfig: [
            {
              type: 'checkbox',
              name: 'update_jail',
              placeholder: T('Update jail as well'),
            },
          ],
          confirmCheckbox: true,
          saveButtonText: T('Update'),
          customSubmit(entityDialog) {
            entityDialog.dialogRef.close(true);
            const dialogRef = self.matDialog.open(EntityJobComponent, { data: { title: T('Updating Plugin') }, disableClose: true });
            dialogRef.componentInstance.disableProgressValue(true);

            dialogRef.componentInstance.setCall('plugin.update_plugin', [row.id, !!entityDialog.formValue.update_jail]);
            dialogRef.componentInstance.submit();
            dialogRef.componentInstance.success.subscribe((res) => {
              dialogRef.close(true);
              this.updateRows([row]);
              this.dialogService.report(T('Plugin Updated'), T('Plugin ') + row.name + T(' updated.'), '500px', 'info');
            });
          },
        };
        this.dialogService.dialogForm(conf);
      },
    },
    {
      name: parentrow.name,
      icon: 'device_hub',
      id: 'mount',
      label: T('Mount points'),
      onClick: (row) => {
        this.router.navigate(
          new Array('').concat(['jails', 'storage', row.name]),
        );
      },
    },
    {
      name: parentrow.name,
      id: 'management',
      label: T('MANAGE'),
      icon: 'settings',
      onClick: (row) => {
        this.gotoAdminPortal(row);
      },
    },
    {
      name: parentrow.name,
      id: 'delete',
      label: T('UNINSTALL'),
      icon: 'delete',
      onClick: (row) => {
        this.entityList.doDelete(row);
      },
    }];

    if (parentrow.plugin === 'asigra') {
      actions.push({
        name: parentrow.name,
        id: 'register',
        label: T('REGISTER'),
        icon: 'assignment',
        onClick: (row) => {
          this.getRegistrationLink();
        },
      });
    }
    if (parentrow.plugin_info) {
      actions.push({
        name: parentrow.name,
        id: 'postinstall',
        label: T('POST INSTALL NOTES'),
        icon: 'description',
        onClick: (row) => {
          let install_notes = '';
          for (const msg of row.plugin_info.split('\n')) {
            install_notes += '<p>' + msg + '</p>';
          }
          this.dialogService.report(T('Post Install Notes'), install_notes, '500px', 'description', true);
        },
      });
    }
    if (parentrow.doc_url) {
      actions.push({
        name: parentrow.name,
        id: 'docurl',
        label: T('DOCUMENTATION'),
        icon: 'info',
        onClick: (row) => {
          window.open(row.doc_url);
        },
      });
    }
    return actions as unknown as EntityTableAction[];
  }

  isActionVisible(actionId: string, row: any) {
    if (actionId === 'start' && row.state === 'up') {
      return false;
    } if (actionId === 'stop' && row.state === 'down') {
      return false;
    } if (actionId === 'management' && (row.state === 'down' || row.admin_portals.length === 0)) {
      return false;
    } if (actionId === 'restart' && row.state === 'down') {
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
    return row.state === 'up' ? [id, { force: true }] : [id];
  }

  resourceTransformIncomingRestData(data) {
    return data.map((plugin) => {
      plugin['boot'] = plugin['boot'] === 'on';
      plugin['icon'] = _.find(this.allPlugins, { plugin: plugin.plugin })
        ? _.find(this.allPlugins, { plugin: plugin.plugin }).icon : '';
      return plugin;
    });
  }

  onCheckboxChange(row) {
    this.loader.open();
    row.boot = !row.boot;
    this.ws.call('plugin.update', [row.id, { boot: row.boot ? 'on' : 'off' }])
      .subscribe(
        (res) => {
          if (!res) {
            row.boot = !row.boot;
          }
          this.loader.close();
        },
        (err) => {
          this.loader.close();
          row.boot = !row.boot;
          new EntityUtils().handleWSError(this, err, this.dialogService);
        },
      );
  }

  gotoAdminPortal(row) {
    if (row.admin_portals.length > 1) {
      const conf: DialogFormConfiguration = {
        title: helptext.portal_dialog.title,
        fieldConfig: [
          {
            type: 'select',
            name: 'admin_portal',
            placeholder: helptext.portal_dialog.admin_portal_placeholder,
            options: row.admin_portals ? row.admin_portals.map((item) => ({ label: item, value: item })) : [],
            value: row.admin_portals[0],
          },
        ],
        saveButtonText: helptext.portal_dialog.saveButtonText,
        customSubmit(entityDialog) {
          const value = entityDialog.formValue;
          window.open(value.admin_portal);
          entityDialog.dialogRef.close(true);
        },
      };
      this.dialogService.dialogForm(conf);
    } else {
      window.open(row.admin_portals);
    }
  }

  iconAction(row) {
    if (row.state === 'up' && row.admin_portals.length > 0) {
      this.gotoAdminPortal(row);
    }
  }
}
