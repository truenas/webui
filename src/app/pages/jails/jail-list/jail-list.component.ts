import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { Pool } from 'app/interfaces/pool.interface';
import { QueryParams } from 'app/interfaces/query-api.interface';
import { EntityDialogComponent } from 'app/pages/common/entity/entity-dialog/entity-dialog.component';
import { EntityTableAction } from 'app/pages/common/entity/entity-table/entity-table.interface';
import * as _ from 'lodash';
import helptext from 'app/helptext/jails/jails-list';
import { DialogService, RestService, WebSocketService } from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { StorageService } from 'app/services/storage.service';
import { T } from 'app/translate-marker';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityJobComponent } from 'app/pages/common/entity/entity-job/entity-job.component';
import { EntityUtils } from 'app/pages/common/entity/utils';

@UntilDestroy()
@Component({
  selector: 'app-jail-list',
  template: '<entity-table [title]="title" [conf]="this" ></entity-table>',
  providers: [DialogService, StorageService],
})
export class JailListComponent {
  isPoolActivated: boolean;
  selectedPool: any;
  activatedPool: any;
  availablePools: Pool[];
  title = 'Jails';
  protected queryCall: 'jail.query' = 'jail.query';
  protected wsDelete: 'jail.delete' = 'jail.delete';
  protected wsMultiDelete: 'core.bulk' = 'core.bulk';
  entityList: any;
  protected route_add = ['jails', 'add', 'wizard'];
  protected route_add_tooltip = 'Add Jail';
  toActivatePool = false;

  columns = [
    { name: T('JID'), prop: 'jid' },
    { name: T('Name'), prop: 'host_hostuuid', always_display: true },
    { name: T('Boot'), prop: 'boot_readble', hidden: true },
    { name: T('State'), prop: 'state' },
    { name: T('Release'), prop: 'release' },
    { name: T('IPv4'), prop: 'ip4_addr', hidden: true },
    { name: T('IPv6'), prop: 'ip6_addr', hidden: true },
    { name: T('Type'), prop: 'type', hidden: true },
    { name: T('Template'), prop: 'template', hidden: true },
    { name: T('Basejail'), prop: 'basejail_readble', hidden: true },
  ];
  rowIdentifier = 'host_hostuuid';
  config: any = {
    paging: true,
    sorting: { columns: this.columns },
    multiSelect: true,
    deleteMsg: {
      title: 'Jail',
      key_props: ['host_hostuuid'],
      id_prop: 'host_hostuuid',
    },
  };
  multiActions: any[] = [{
    id: 'mstart',
    label: T('Start'),
    icon: 'play_arrow',
    enable: true,
    ttpos: 'above', // tooltip position
    onClick: (selected: any) => {
      const selectedJails = this.getSelectedNames(selected);
      this.loader.open();
      this.entityList.busy = this.ws.job('core.bulk', ['jail.start', selectedJails]).pipe(untilDestroyed(this)).subscribe(
        (res) => {
          for (const i in selected) {
            selected[i].state = 'up';
            this.updateRow(selected[i]);
          }
          this.updateMultiAction(selected);
          this.loader.close();
          let message = '';
          for (let i = 0; i < res.result.length; i++) {
            if (res.result[i].error != null) {
              message = message + '<li>' + selectedJails[i] + ': ' + res.result[i].error + '</li>';
            }
          }
          if (message === '') {
            this.dialogService.Info(T('Jails Started'), T('Jails started.'));
          } else {
            message = '<ul>' + message + '</ul>';
            this.dialogService.errorReport(T('Jails failed to start'), message);
          }
        },
        (res) => {
          this.loader.close();
          new EntityUtils().handleWSError(this.entityList, res, this.dialogService);
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
    onClick: (selected: any) => {
      const dialog: any = {};
      this.dialogService.confirm('Stop', 'Stop the selected jails?',
        dialog.hasOwnProperty('hideCheckbox') ? dialog['hideCheckbox'] : true, T('Stop')).pipe(untilDestroyed(this)).subscribe((res: boolean) => {
        if (res) {
          const selectedJails = this.getSelectedNames(selected);
          this.loader.open();
          this.entityList.busy = this.ws.job('core.bulk', ['jail.stop', selectedJails]).pipe(untilDestroyed(this)).subscribe(
            () => {
              for (const i in selected) {
                selected[i].state = 'down';
                this.updateRow(selected[i]);
              }
              this.updateMultiAction(selected);
              this.loader.close();
            },
            (res) => {
              this.loader.close();
              new EntityUtils().handleWSError(this.entityList, res, this.dialogService);
            },
          );
        }
      });
    },
  },
  {
    id: 'mupdate',
    label: T('Update'),
    icon: 'update',
    enable: true,
    ttpos: 'above',
    onClick: (selected: any) => {
      const selectedJails = this.getSelectedNames(selected);
      this.dialogService.Info(T('Jail Update'), T('Updating selected plugins.'));
      this.entityList.busy = this.ws.job('core.bulk', ['jail.update_to_latest_patch', selectedJails]).pipe(untilDestroyed(this)).subscribe(
        (res) => {
          let message = '';
          for (let i = 0; i < res.result.length; i++) {
            if (res.result[i].error != null) {
              message = message + '<li>' + selectedJails[i] + ': ' + res.result[i].error + '</li>';
            } else {
              this.updateRow(selected[i]);
            }
          }
          if (message === '') {
            this.dialogService.Info('', T('Selected jails updated.'), '500px', 'info', true);
          } else {
            message = '<ul>' + message + '</ul>';
            this.dialogService.errorReport(T('Jail Update Failed'), message);
          }
        },
        (res) => {
          new EntityUtils().handleWSError(this.entityList, res, this.dialogService);
        },
      );
    },
  },
  {
    id: 'mdelete',
    label: T('Delete'),
    icon: 'delete',
    enable: true,
    ttpos: 'above',
    onClick: (selected: any) => {
      this.entityList.doMultiDelete(selected);
    },
  },
  ];

  protected globalConfig = {
    id: 'config',
    tooltip: helptext.globalConfig.tooltip,
    onClick: () => {
      this.prerequisite().then(() => {
        if (this.availablePools !== undefined) {
          this.activatePool();
        }
      });
    },
  };

  protected addBtnDisabled = true;

  constructor(public router: Router, protected rest: RestService, public ws: WebSocketService,
    public loader: AppLoaderService, public dialogService: DialogService, private translate: TranslateService,
    public sorter: StorageService, public dialog: MatDialog) {}

  noPoolDialog(): void {
    const dialogRef = this.dialogService.confirm(
      helptext.noPoolDialog.title,
      helptext.noPoolDialog.message,
      true,
      helptext.noPoolDialog.buttonMsg,
    );

    dialogRef.pipe(untilDestroyed(this)).subscribe((res: boolean) => {
      if (res) {
        this.router.navigate(new Array('/').concat(['storage', 'pools', 'manager']));
      }
    });
  }

  prerequisite(): Promise<boolean> {
    return new Promise(async (resolve) => {
      await this.ws.call('pool.query').toPromise().then((pools) => {
        if (pools.length === 0) {
          resolve(true);
          this.noPoolDialog();
          return;
        }
        this.availablePools = pools;
      }, (err) => {
        resolve(false);
        new EntityUtils().handleWSError(this.entityList, err, this.dialogService);
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
          this.dialogService.errorReport(err.trace.class, err.reason, err.trace.formatted).pipe(untilDestroyed(this)).subscribe(
            () => {
              resolve(false);
            },
          );
        });
      }
    });
  }
  prerequisiteFailedHandler(entityList: any): void {
    this.entityList = entityList;
  }

  afterInit(entityList: any): void {
    this.entityList = entityList;
  }

  activatePool(): void {
    const self = this;

    const conf: DialogFormConfiguration = {
      title: helptext.activatePoolDialog.title,
      fieldConfig: [
        {
          type: 'select',
          name: 'selectedPool',
          placeholder: helptext.activatePoolDialog.selectedPool_placeholder,
          options: this.availablePools ? this.availablePools.map((pool) => ({
            label: pool.name + (pool.is_decrypted ? (pool.status === PoolStatus.Online ? '' : ` (${pool.status})`) : ' (Locked)'),
            value: pool.name,
            disable: !pool.is_decrypted || pool.status !== PoolStatus.Online,
          })) : [],
          value: this.activatedPool,
        },
      ],
      saveButtonText: helptext.activatePoolDialog.saveButtonText,
      customSubmit(entityDialog: EntityDialogComponent) {
        const value = entityDialog.formValue;
        self.entityList.loader.open();
        self.ws.call('jail.activate', [value['selectedPool']]).pipe(untilDestroyed(this)).subscribe(
          () => {
            self.addBtnDisabled = false;
            self.activatedPool = value['selectedPool'];
            entityDialog.dialogRef.close(true);
            self.entityList.loaderOpen = true;
            self.entityList.getData();
            self.dialogService.Info(
              helptext.activatePoolDialog.successInfoDialog.title,
              helptext.activatePoolDialog.successInfoDialog.message + value['selectedPool'],
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

  getActions(parentRow: any): EntityTableAction[] {
    return [{
      name: parentRow.host_hostuuid,
      icon: 'edit',
      id: 'edit',
      label: T('Edit'),
      onClick: (row: any) => {
        this.router.navigate(
          new Array('').concat(['jails', 'edit', row.host_hostuuid]),
        );
      },
    },
    {
      name: parentRow.host_hostuuid,
      icon: 'device_hub',
      id: 'mount',
      label: T('Mount points'),
      onClick: (row: any) => {
        this.router.navigate(
          new Array('').concat(['jails', 'storage', row.host_hostuuid]),
        );
      },
    },
    {
      name: parentRow.host_hostuuid,
      icon: 'play_arrow',
      id: 'start',
      label: T('Start'),
      onClick: (row: any) => {
        const dialogRef = this.dialog.open(EntityJobComponent, { data: { title: T('Starting Jail') }, disableClose: true });
        dialogRef.componentInstance.setCall('jail.start', [row.host_hostuuid]);
        dialogRef.componentInstance.submit();
        dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
          dialogRef.close(true);
          this.updateRow(row);
          this.updateMultiAction([row]);
        });
      },
    },
    {
      name: parentRow.host_hostuuid,
      icon: 'cached',
      id: 'restart',
      label: T('Restart'),
      onClick: (row: any) => {
        const dialogRef = this.dialog.open(EntityJobComponent, { data: { title: T('Restarting Jail') }, disableClose: true });
        dialogRef.componentInstance.setCall('jail.restart', [row.host_hostuuid]);
        dialogRef.componentInstance.submit();
        dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
          dialogRef.close(true);
          this.updateRow(row);
          this.updateMultiAction([row]);
        });
      },
    },
    {
      name: parentRow.host_hostuuid,
      icon: 'stop',
      id: 'stop',
      label: T('Stop'),
      onClick: (row: any) => {
        const dialog: any = {};
        this.dialogService.confirm('Stop', 'Stop the selected jail?',
          dialog.hasOwnProperty('hideCheckbox') ? dialog['hideCheckbox'] : true, T('Stop')).pipe(untilDestroyed(this)).subscribe((dialog_res: boolean) => {
          if (dialog_res) {
            const dialogRef = this.dialog.open(EntityJobComponent, { data: { title: T('Stopping Jail') }, disableClose: true });
            dialogRef.componentInstance.setCall('jail.stop', [row.host_hostuuid]);
            dialogRef.componentInstance.submit();
            dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
              dialogRef.close(true);
              this.updateRow(row);
              this.updateMultiAction([row]);
            });
          }
        });
      },
    },
    {
      name: parentRow.host_hostuuid,
      icon: 'update',
      id: 'update',
      label: T('Update'),
      onClick: (row: any) => {
        this.dialogService.confirm(
          helptext.updateConfirmDialog.title,
          helptext.updateConfirmDialog.message, true,
        ).pipe(untilDestroyed(this)).subscribe((dialog_res: boolean) => {
          if (dialog_res) {
            const dialogRef = this.dialog.open(EntityJobComponent, { data: { title: T('Updating Jail') }, disableClose: true });
            dialogRef.componentInstance.setCall('jail.update_to_latest_patch', [row.host_hostuuid]);
            dialogRef.componentInstance.submit();
            dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
              dialogRef.close(true);
              this.updateRow(row);
              this.dialogService.Info(T('Jail Updated'), T('Jail <i>') + row.host_hostuuid + T('</i> updated.'), '500px', 'info', true);
            });
          }
        });
      },
    },
    {
      name: parentRow.host_hostuuid,
      icon: 'keyboard_arrow_right',
      id: 'shell',
      label: T('Shell'),
      onClick: (row: any) => {
        this.router.navigate(
          new Array('').concat(['jails', 'shell', row.host_hostuuid]),
        );
      },
    },
    {
      name: parentRow.host_hostuuid,
      icon: 'delete',
      id: 'delete',
      label: T('Delete'),
      onClick: (row: any) => {
        this.entityList.doDelete(row);
      },
    },
    ] as EntityTableAction[];
  }

  isActionVisible(actionId: string, row: any): boolean {
    if (actionId === 'start' && row.state === 'up') {
      return false;
    } if (actionId === 'stop' && row.state === 'down') {
      return false;
    } if (actionId === 'shell' && row.state === 'down') {
      return false;
    } if (actionId === 'restart' && row.state === 'down') {
      return false;
    }

    return true;
  }

  getSelectedNames(selectedJails: any[]): any[] {
    const selected: any = [];
    for (const i in selectedJails) {
      selected.push([selectedJails[i].host_hostuuid]);
    }
    return selected;
  }

  updateRow(row: any): void {
    this.ws.call(this.queryCall, [[['host_hostuuid', '=', row.host_hostuuid]]]).pipe(untilDestroyed(this)).subscribe(
      (res) => {
        if (res[0]) {
          const prefix = (res[0].state === 'up' && res[0].dhcp === 'on') ? 'DHCP: ' : '';
          for (const col of this.entityList.allColumns) {
            if (col.prop == 'ip4_addr' && _.split(res[0].ip4_addr, '|').length > 1) {
              row.ip4_addr = prefix + _.split(res[0].ip4_addr, '|')[1];
            } else {
              row[col.prop] = res[0][col.prop];
            }
          }
        }
      },
    );
  }

  updateMultiAction(selected: any): void {
    if (_.find(selected, ['state', 'up'])) {
      _.find(this.multiActions, { id: 'mstop' as any })['enable'] = true;
    } else {
      _.find(this.multiActions, { id: 'mstop' as any })['enable'] = false;
    }

    if (_.find(selected, ['state', 'down'])) {
      _.find(this.multiActions, { id: 'mstart' as any })['enable'] = true;
    } else {
      _.find(this.multiActions, { id: 'mstart' as any })['enable'] = false;
    }
  }

  wsMultiDeleteParams(selected: any): any[] {
    const params: any[] = ['jail.delete'];
    params.push(this.getSelectedNames(selected));
    return params;
  }

  dataHandler(entityList: any): void {
    // Call sort on load to make sure initial sort is by Jail name, asecnding
    entityList.rows = this.sorter.tableSorter(entityList.rows, 'host_hostuuid', 'asc');
    for (let i = 0; i < entityList.rows.length; i++) {
      entityList.rows[i].boot_readble = entityList.rows[i].boot === 0 ? 'off' : 'on';
      entityList.rows[i].source_template = entityList.rows[i].source_template ? entityList.rows[i].source_template : '-';
      entityList.rows[i].basejail_readble = entityList.rows[i].basejail === 0 ? 'no' : 'yes';

      const prefix = (entityList.rows[i].state === 'up' && entityList.rows[i].dhcp === 'on') ? 'DHCP: ' : '';
      if (_.split(entityList.rows[i].ip4_addr, '|').length > 1) {
        entityList.rows[i].ip4_addr = prefix + _.split(entityList.rows[i].ip4_addr, '|')[1];
      }
      if (entityList.rows[i].ip6_addr == 'vnet0|accept_rtadv') {
        entityList.rows[i].ip6_addr = 'Auto';
      }
    }
  }

  wsDeleteParams(row: any, id: any): QueryParams<any, any> {
    return row.state === 'up' ? [id, { force: true }] : [id];
  }
}
