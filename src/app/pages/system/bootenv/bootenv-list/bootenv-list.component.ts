import {
  Component, ElementRef, ViewChild,
} from '@angular/core';
import { TooltipPosition } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { filter } from 'rxjs/operators';
import { helptext_system_bootenv } from 'app/helptext/system/boot-env';
import { Bootenv } from 'app/interfaces/bootenv.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/pages/common/entity/entity-dialog/entity-dialog.component';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table/entity-table.component';
import { EntityTableAction, EntityTableConfig } from 'app/pages/common/entity/entity-table/entity-table.interface';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { DialogService, WebSocketService, SystemGeneralService } from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { LocaleService } from 'app/services/locale.service';
import { StorageService } from 'app/services/storage.service';
import { T } from 'app/translate-marker';
import { BootenvRow } from './bootenv-row.interface';

@UntilDestroy()
@Component({
  selector: 'app-bootenv-list',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
})
export class BootEnvironmentListComponent implements EntityTableConfig {
  @ViewChild('scrubIntervalEvent', { static: true }) scrubIntervalEvent: ElementRef;

  title = T('Boot Environments');
  resource_name = 'system/bootenv';
  queryCall: 'bootenv.query' = 'bootenv.query';
  route_add: string[] = ['system', 'boot', 'create'];
  protected route_delete: string[] = ['system', 'boot', 'delete'];
  wsDelete: 'bootenv.delete' = 'bootenv.delete';
  wsMultiDelete: 'core.bulk' = 'core.bulk';
  protected entityList: EntityTableComponent;
  protected wsActivate: 'bootenv.activate' = 'bootenv.activate';
  protected wsKeep: 'bootenv.set_attribute' = 'bootenv.set_attribute';
  protected loaderOpen = false;
  size_consumed: string;
  condition: string;
  size_boot: string;
  percentange: string;
  header: string;
  scrub_msg: string;
  scrub_interval: number;

  constructor(
    private _router: Router,
    public ws: WebSocketService,
    public dialog: DialogService,
    protected loader: AppLoaderService,
    private storage: StorageService,
    protected localeService: LocaleService,
    private sysGeneralService: SystemGeneralService,
  ) {}

  columns = [
    { name: T('Name'), prop: 'name', always_display: true },
    { name: T('Active'), prop: 'active' },
    { name: T('Created'), prop: 'created' },
    { name: T('Space'), prop: 'rawspace' },
    { name: T('Keep'), prop: 'keep' },
  ];
  config = {
    paging: true,
    sorting: { columns: this.columns },
    multiSelect: true,
    deleteMsg: {
      title: T('Boot Environment'),
      key_props: ['name'],
    },
  };

  preInit(): void {
    this.sysGeneralService.getAdvancedConfig$.pipe(untilDestroyed(this)).subscribe((res) => {
      this.scrub_interval = res.boot_scrub;
      this.updateBootState();
    });
  }

  dataHandler(entityList: EntityTableComponent): void {
    entityList.rows = entityList.rows.map((row: Bootenv) => {
      return {
        ...row,
        rawspace: this.storage.convertBytestoHumanReadable(row.rawspace),
        hideCheckbox: row.active !== '-' && row.active !== '',
      } as BootenvRow;
    });
  }

  rowValue(row: BootenvRow, attr: keyof BootenvRow): unknown {
    if (attr === 'created') {
      return this.localeService.formatDateTime(row.created.$date);
    }
    if (attr === 'active') {
      if (row.active === 'N') {
        return 'Now';
      } if (row.active === 'R') {
        return 'Reboot';
      } if (row.active === 'NR') {
        return 'Now/Reboot';
      }
      return row.active;
    }
    return row[attr];
  }

  afterInit(entityList: EntityTableComponent): void {
    this.entityList = entityList;
  }

  isActionVisible(actionId: string): boolean {
    if (actionId == 'edit' || actionId == 'add') {
      return false;
    }
    return true;
  }

  getActions(row: BootenvRow): EntityTableAction[] {
    const actions = [];
    if (!row.active.includes('Reboot')) {
      actions.push({
        label: T('Activate'),
        id: 'activate',
        onClick: (row: BootenvRow) => {
          this.doActivate(row.id);
        },
      });
    }

    actions.push({
      label: T('Clone'),
      id: 'clone',
      onClick: (row: BootenvRow) => {
        this._router.navigate(new Array('').concat(
          ['system', 'boot', 'clone', row.id],
        ));
      },
    });

    actions.push({
      label: T('Rename'),
      id: 'rename',
      onClick: (row: BootenvRow) => {
        this._router.navigate(new Array('').concat(
          ['system', 'boot', 'rename', row.id],
        ));
      },
    });

    if (row.active === '-' || row.active === '') {
      actions.push({
        label: T('Delete'),
        id: 'delete',
        onClick: (row: BootenvRow) =>
          this.entityList.doDeleteJob(row).pipe(untilDestroyed(this)).subscribe(
            (success) => {
              if (!success) {
                this.dialog.errorReport(
                  helptext_system_bootenv.delete_failure_dialog.title,
                  helptext_system_bootenv.delete_failure_dialog.message,
                );
              }
            },
            console.error,
            () => {
              this.entityList.getData();
              this.updateBootState();
              this.entityList.selection.clear();
            },
          ),
      });
    }

    if (row.keep === true) {
      actions.push({
        label: T('Unkeep'),
        id: 'keep',
        onClick: (row: BootenvRow) => {
          this.toggleKeep(row.id, row.keep);
        },
      });
    } else {
      actions.push({
        label: T('Keep'),
        id: 'keep',
        onClick: (row: BootenvRow) => {
          this.toggleKeep(row.id, row.keep);
        },
      });
    }

    return actions as EntityTableAction[];
  }

  multiActions = [{
    id: 'mdelete',
    label: T('Delete'),
    icon: 'delete',
    enable: true,
    ttpos: 'above' as TooltipPosition,
    onClick: (selected: BootenvRow[]) => {
      for (let i = selected.length - 1; i >= 0; i--) {
        if (selected[i].active !== '-' && selected[i].active !== '') {
          selected.splice(i, 1);
        }
      }
      this.entityList.doMultiDelete(selected);
    },
  }];

  getSelectedNames(selectedBootenvs: BootenvRow[]): string[][] {
    const selected: string[][] = [];
    selectedBootenvs.forEach((bootenv) => {
      if (bootenv.active === '-' || bootenv.active === '') {
        selected.push([bootenv.id]);
      }
    });
    return selected;
  }

  wsMultiDeleteParams(selected: BootenvRow[]): any[] {
    const params: any[] = ['bootenv.do_delete'];
    params.push(this.getSelectedNames(selected));
    return params;
  }

  doActivate(id: string): void {
    this.dialog.confirm({
      title: T('Activate'),
      message: T('Activate this Boot Environment?'),
      buttonMsg: helptext_system_bootenv.list_dialog_activate_action,
    }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.loader.open();
      this.loaderOpen = true;
      this.ws.call(this.wsActivate, [id]).pipe(untilDestroyed(this)).subscribe(
        () => {
          this.entityList.getData();
          this.loader.close();
          this.entityList.selection.clear();
        },
        (res: WebsocketError) => {
          new EntityUtils().handleWSError(this, res, this.dialog);
          this.loader.close();
        },
      );
    });
  }

  updateBootState(): void {
    this.ws.call('boot.get_state').pipe(untilDestroyed(this)).subscribe((state) => {
      if (state.scan.end_time) {
        this.scrub_msg = this.localeService.formatDateTime(state.scan.end_time.$date);
      } else {
        this.scrub_msg = T('Never');
      }
      this.size_consumed = this.storage.convertBytestoHumanReadable(state.properties.allocated.parsed);
      this.condition = state.properties.health.value;
      if (this.condition === 'DEGRADED') {
        this.condition = this.condition + T(' Check Notifications for more details.');
      }
      this.size_boot = this.storage.convertBytestoHumanReadable(state.properties.size.parsed);
      this.percentange = state.properties.capacity.value;
    });
  }

  toggleKeep(id: string, status: boolean): void {
    if (!status) {
      this.dialog.confirm({
        title: T('Keep'),
        message: T('Keep this Boot Environment?'),
        buttonMsg: helptext_system_bootenv.list_dialog_keep_action,
      }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
        this.loader.open();
        this.loaderOpen = true;
        this.ws.call(this.wsKeep, [id, { keep: true }]).pipe(untilDestroyed(this)).subscribe(
          () => {
            this.entityList.getData();
            this.loader.close();
            this.entityList.selection.clear();
          },
          (res: WebsocketError) => {
            new EntityUtils().handleWSError(this, res, this.dialog);
            this.loader.close();
          },
        );
      });
    } else {
      this.dialog.confirm({
        title: T('Unkeep'),
        message: T('No longer keep this Boot Environment?'),
        buttonMsg: helptext_system_bootenv.list_dialog_unkeep_action,
      }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
        this.loader.open();
        this.loaderOpen = true;
        this.ws.call(this.wsKeep, [id, { keep: false }]).pipe(untilDestroyed(this)).subscribe(
          () => {
            this.entityList.getData();
            this.loader.close();
            this.entityList.selection.clear();
          },
          (res: WebsocketError) => {
            new EntityUtils().handleWSError(this, res, this.dialog);
            this.loader.close();
          },
        );
      });
    }
  }

  getAddActions(): EntityTableAction[] {
    return [{
      label: T('Stats/Settings'),
      onClick: () => {
        this.sysGeneralService.getAdvancedConfig$.pipe(untilDestroyed(this)).subscribe((res) => {
          this.scrub_interval = res.boot_scrub;
          const localWS = this.ws;
          const localDialog = this.dialog;
          const statusConfigFieldConf: FieldConfig[] = [
            {
              type: 'paragraph',
              name: 'condition',
              paraText: T(`<b>Boot Pool Condition:</b> ${this.condition}`),
            },
            {
              type: 'paragraph',
              name: 'size_boot',
              paraText: T(`<b>Size:</b> ${this.size_boot}`),
            },
            {
              type: 'paragraph',
              name: 'size_consumed',
              paraText: T(`<b>Used:</b> ${this.size_consumed}`),
            },
            {
              type: 'paragraph',
              name: 'scrub_msg',
              paraText: T(`<b>Last Scrub Run:</b> ${this.scrub_msg}<br /><br />`),
            },
            {
              type: 'input',
              name: 'new_scrub_interval',
              placeholder: T('Scrub interval (in days)'),
              inputType: 'number',
              value: this.scrub_interval,
              required: true,
            },
          ];

          const statusSettings: DialogFormConfiguration = {
            title: T('Stats/Settings'),
            fieldConfig: statusConfigFieldConf,
            saveButtonText: T('Update Interval'),
            cancelButtonText: T('Close'),
            parent: this,
            customSubmit(entityDialog: EntityDialogComponent) {
              const scrubIntervalValue = parseInt(entityDialog.formValue.new_scrub_interval);
              if (scrubIntervalValue > 0) {
                localWS.call('boot.set_scrub_interval', [scrubIntervalValue]).pipe(untilDestroyed(entityDialog.parent)).subscribe(() => {
                  localDialog.closeAllDialogs();
                  localDialog.info(T('Scrub Interval Set'), T(`Scrub interval set to ${scrubIntervalValue} days`), '300px', 'info', true);
                });
              } else {
                localDialog.info(T('Enter valid value'), T(scrubIntervalValue + ' is not a valid number of days.'));
              }
            },
          };
          this.dialog.dialogForm(statusSettings);
        });
      },
    }, {
      label: T('Boot Pool Status'),
      onClick: () => {
        this.goToStatus();
      },
    },
    {
      label: T('Scrub Boot Pool'),
      onClick: () => {
        this.scrub();
      },
    },
    ] as EntityTableAction[];
  }

  goToStatus(): void {
    this._router.navigate(new Array('').concat(
      ['system', 'boot', 'status'],
    ));
  }

  scrub(): void {
    this.dialog.confirm({
      title: T('Scrub'),
      message: T('Start the scrub now?'),
      buttonMsg: helptext_system_bootenv.list_dialog_scrub_action,
    }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.loader.open();
      this.loaderOpen = true;
      this.ws.call('boot.scrub').pipe(untilDestroyed(this)).subscribe(() => {
        this.loader.close();
        this.dialog.info(T('Scrub Started'), T(''), '300px', 'info', true);
      },
      (res: WebsocketError) => {
        new EntityUtils().handleWSError(this, res, this.dialog);
        this.loader.close();
      });
    });
  }
}
