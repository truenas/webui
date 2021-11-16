import {
  Component, ElementRef, ViewChild,
} from '@angular/core';
import { TooltipPosition } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { BootEnvironmentActions } from 'app/enums/bootenv-actions.enum';
import { helptextSystemBootenv } from 'app/helptext/system/boot-env';
import { Bootenv } from 'app/interfaces/bootenv.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/pages/common/entity/entity-dialog/entity-dialog.component';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table/entity-table.component';
import { EntityTableAction, EntityTableConfig } from 'app/pages/common/entity/entity-table/entity-table.interface';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { BootEnvironmentFormComponent } from 'app/pages/system/bootenv/bootenv-form/bootenv-form.component';
import { DialogService, WebSocketService, SystemGeneralService } from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { IxModalService } from 'app/services/ix-modal.service';
import { LocaleService } from 'app/services/locale.service';
import { StorageService } from 'app/services/storage.service';
import { BootenvRow } from './bootenv-row.interface';

@UntilDestroy()
@Component({
  selector: 'app-bootenv-list',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
})
export class BootEnvironmentListComponent implements EntityTableConfig {
  @ViewChild('scrubIntervalEvent', { static: true }) scrubIntervalEvent: ElementRef;

  title = this.translate.instant('Boot Environments');
  resource_name = 'system/bootenv';
  queryCall = 'bootenv.query' as const;
  protected route_delete: string[] = ['system', 'boot', 'delete'];
  wsDelete = 'bootenv.delete' as const;
  wsMultiDelete = 'core.bulk' as const;
  protected entityList: EntityTableComponent;
  protected wsActivate = 'bootenv.activate' as const;
  protected wsKeep = 'bootenv.set_attribute' as const;
  protected loaderOpen = false;
  size_consumed: string;
  condition: string;
  size_boot: string;
  percentange: string;
  header: string;
  scrub_msg: string;
  scrub_interval: number;

  constructor(
    private router: Router,
    public ws: WebSocketService,
    public dialog: DialogService,
    protected loader: AppLoaderService,
    private storage: StorageService,
    protected localeService: LocaleService,
    private sysGeneralService: SystemGeneralService,
    protected translate: TranslateService,
    private modalService: IxModalService,
  ) {}

  columns = [
    { name: this.translate.instant('Name'), prop: 'name', always_display: true },
    { name: this.translate.instant('Active'), prop: 'active' },
    { name: this.translate.instant('Created'), prop: 'created' },
    { name: this.translate.instant('Space'), prop: 'rawspace' },
    { name: this.translate.instant('Keep'), prop: 'keep' },
  ];
  config = {
    paging: true,
    sorting: { columns: this.columns },
    multiSelect: true,
    deleteMsg: {
      title: this.translate.instant('Boot Environment'),
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

    this.modalService.onClose$.pipe(untilDestroyed(this)).subscribe(() => {
      this.entityList.getData();
    });
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
        label: this.translate.instant('Activate'),
        id: 'activate',
        onClick: (row: BootenvRow) => {
          this.doActivate(row.id);
        },
      });
    }

    actions.push({
      label: this.translate.instant('Clone'),
      id: 'clone',
      onClick: (row: BootenvRow) => {
        const modal = this.modalService.open(BootEnvironmentFormComponent);
        modal.setupForm(BootEnvironmentActions.Clone, row.id);
      },
    });

    actions.push({
      label: this.translate.instant('Rename'),
      id: 'rename',
      onClick: (row: BootenvRow) => {
        const modal = this.modalService.open(BootEnvironmentFormComponent);
        modal.setupForm(BootEnvironmentActions.Rename, row.id);
      },
    });

    if (row.active === '-' || row.active === '') {
      actions.push({
        label: this.translate.instant('Delete'),
        id: 'delete',
        onClick: (row: BootenvRow) => {
          return this.entityList.doDeleteJob(row).pipe(untilDestroyed(this)).subscribe(
            (success) => {
              if (!success) {
                this.dialog.errorReport(
                  helptextSystemBootenv.delete_failure_dialog.title,
                  helptextSystemBootenv.delete_failure_dialog.message,
                );
              }
            },
            console.error,
            () => {
              this.entityList.getData();
              this.updateBootState();
              this.entityList.selection.clear();
            },
          );
        },
      });
    }

    if (row.keep) {
      actions.push({
        label: this.translate.instant('Unkeep'),
        id: 'keep',
        onClick: (row: BootenvRow) => {
          this.toggleKeep(row.id, row.keep);
        },
      });
    } else {
      actions.push({
        label: this.translate.instant('Keep'),
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
    label: this.translate.instant('Delete'),
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

  wsMultiDeleteParams(selected: BootenvRow[]): (string | string[][])[] {
    const params: (string | string[][])[] = ['bootenv.do_delete'];
    params.push(this.getSelectedNames(selected));
    return params;
  }

  doActivate(id: string): void {
    this.dialog.confirm({
      title: this.translate.instant('Activate'),
      message: this.translate.instant('Activate this Boot Environment?'),
      buttonMsg: helptextSystemBootenv.list_dialog_activate_action,
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
        this.scrub_msg = this.translate.instant('Never');
      }
      this.size_consumed = this.storage.convertBytestoHumanReadable(state.properties.allocated.parsed);
      this.condition = state.properties.health.value;
      if (this.condition === 'DEGRADED') {
        this.condition = this.condition + this.translate.instant(' Check Notifications for more details.');
      }
      this.size_boot = this.storage.convertBytestoHumanReadable(state.properties.size.parsed);
      this.percentange = state.properties.capacity.value;
    });
  }

  toggleKeep(id: string, status: boolean): void {
    if (!status) {
      this.dialog.confirm({
        title: this.translate.instant('Keep'),
        message: this.translate.instant('Keep this Boot Environment?'),
        buttonMsg: helptextSystemBootenv.list_dialog_keep_action,
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
        title: this.translate.instant('Unkeep'),
        message: this.translate.instant('No longer keep this Boot Environment?'),
        buttonMsg: helptextSystemBootenv.list_dialog_unkeep_action,
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
      label: this.translate.instant('Add'),
      onClick: () => {
        const modal = this.modalService.open(BootEnvironmentFormComponent);
        modal.setupForm(BootEnvironmentActions.Create);
      },
    }, {
      label: this.translate.instant('Stats/Settings'),
      onClick: () => {
        this.sysGeneralService.getAdvancedConfig$.pipe(untilDestroyed(this)).subscribe((res) => {
          this.scrub_interval = res.boot_scrub;
          const localWS = this.ws;
          const localDialog = this.dialog;
          const statusConfigFieldConf: FieldConfig[] = [
            {
              type: 'paragraph',
              name: 'condition',
              paraText: this.translate.instant('<b>Boot Pool Condition:</b> {condition}', { condition: this.condition }),
            },
            {
              type: 'paragraph',
              name: 'size_boot',
              paraText: this.translate.instant('<b>Size:</b> {size_boot}', { size_boot: this.size_boot }),
            },
            {
              type: 'paragraph',
              name: 'size_consumed',
              paraText: this.translate.instant('<b>Used:</b> {size_consumed}', { size_consumed: this.size_consumed }),
            },
            {
              type: 'paragraph',
              name: 'scrub_msg',
              paraText: this.translate.instant('<b>Last Scrub Run:</b> {scrub_msg}<br /><br />', { scrub_msg: this.scrub_msg }),
            },
            {
              type: 'input',
              name: 'new_scrub_interval',
              placeholder: this.translate.instant('Scrub interval (in days)'),
              inputType: 'number',
              value: this.scrub_interval,
              required: true,
            },
          ];

          const statusSettings: DialogFormConfiguration = {
            title: this.translate.instant('Stats/Settings'),
            fieldConfig: statusConfigFieldConf,
            saveButtonText: this.translate.instant('Update Interval'),
            cancelButtonText: this.translate.instant('Close'),
            parent: this,
            customSubmit: (entityDialog: EntityDialogComponent) => {
              const scrubIntervalValue = parseInt(entityDialog.formValue.new_scrub_interval);
              if (scrubIntervalValue > 0) {
                localWS.call('boot.set_scrub_interval', [scrubIntervalValue]).pipe(untilDestroyed(this)).subscribe(() => {
                  localDialog.closeAllDialogs();
                  localDialog.info(
                    this.translate.instant('Scrub Interval Set'),
                    this.translate.instant('Scrub interval set to {scrubIntervalValue} days', { scrubIntervalValue }),
                    '300px',
                    'info',
                    true,
                  );
                });
              } else {
                localDialog.info(
                  this.translate.instant('Enter valid value'),
                  this.translate.instant('{scrubIntervalValue} is not a valid number of days.', { scrubIntervalValue }),
                );
              }
            },
          };
          this.dialog.dialogForm(statusSettings);
        });
      },
    }, {
      label: this.translate.instant('Boot Pool Status'),
      onClick: () => {
        this.goToStatus();
      },
    },
    {
      label: this.translate.instant('Scrub Boot Pool'),
      onClick: () => {
        this.scrub();
      },
    },
    ] as EntityTableAction[];
  }

  goToStatus(): void {
    this.router.navigate(['/', 'system', 'boot', 'status']);
  }

  scrub(): void {
    this.dialog.confirm({
      title: this.translate.instant('Scrub'),
      message: this.translate.instant('Start the scrub now?'),
      buttonMsg: helptextSystemBootenv.list_dialog_scrub_action,
    }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.loader.open();
      this.loaderOpen = true;
      this.ws.call('boot.scrub').pipe(untilDestroyed(this)).subscribe(() => {
        this.loader.close();
        this.dialog.info(this.translate.instant('Scrub Started'), '', '300px', 'info', true);
      },
      (res: WebsocketError) => {
        new EntityUtils().handleWSError(this, res, this.dialog);
        this.loader.close();
      });
    });
  }
}
