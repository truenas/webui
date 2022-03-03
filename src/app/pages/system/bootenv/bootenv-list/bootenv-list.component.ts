import {
  Component,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TooltipPosition } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { BootEnvironmentActions } from 'app/enums/bootenv-actions.enum';
import { helptextSystemBootenv } from 'app/helptext/system/boot-env';
import { Bootenv } from 'app/interfaces/bootenv.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { AppLoaderService } from 'app/modules/app-loader/app-loader.service';
import { EntityTableComponent } from 'app/modules/entity/entity-table/entity-table.component';
import { EntityTableAction, EntityTableConfig } from 'app/modules/entity/entity-table/entity-table.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { BootEnvironmentFormComponent } from 'app/pages/system/bootenv/bootenv-form/bootenv-form.component';
import {
  BootenvStatsDialogComponent,
} from 'app/pages/system/bootenv/bootenv-stats-dialog/bootenv-stats-dialog.component';
import { DialogService, WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { LocaleService } from 'app/services/locale.service';
import { StorageService } from 'app/services/storage.service';
import { BootenvRow } from './bootenv-row.interface';

@UntilDestroy()
@Component({
  selector: 'app-bootenv-list',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
})
export class BootEnvironmentListComponent implements EntityTableConfig {
  title = this.translate.instant('Boot Environments');
  resourceName = 'system/bootenv';
  queryCall = 'bootenv.query' as const;
  protected routeDelete: string[] = ['system', 'boot', 'delete'];
  wsDelete = 'bootenv.delete' as const;
  wsMultiDelete = 'core.bulk' as const;
  protected entityList: EntityTableComponent;
  protected wsActivate = 'bootenv.activate' as const;
  protected wsKeep = 'bootenv.set_attribute' as const;

  constructor(
    private router: Router,
    public ws: WebSocketService,
    public dialog: DialogService,
    private matDialog: MatDialog,
    protected loader: AppLoaderService,
    private storage: StorageService,
    protected localeService: LocaleService,
    protected translate: TranslateService,
    private slideInService: IxSlideInService,
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

  dataHandler(entityList: EntityTableComponent): void {
    entityList.rows = entityList.rows.map((row: Bootenv) => {
      return {
        ...row,
        rawspace: this.storage.convertBytesToHumanReadable(row.rawspace),
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

    this.slideInService.onClose$.pipe(untilDestroyed(this)).subscribe(() => {
      this.entityList.getData();
    });
  }

  isActionVisible(actionId: string): boolean {
    if (actionId === 'edit' || actionId === 'add') {
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
        const modal = this.slideInService.open(BootEnvironmentFormComponent);
        modal.setupForm(BootEnvironmentActions.Clone, row.id);
      },
    });

    actions.push({
      label: this.translate.instant('Rename'),
      id: 'rename',
      onClick: (row: BootenvRow) => {
        const modal = this.slideInService.open(BootEnvironmentFormComponent);
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
      this.ws.call(this.wsActivate, [id]).pipe(untilDestroyed(this)).subscribe(
        () => {
          this.entityList.getData();
          this.loader.close();
          this.entityList.selection.clear();
        },
        (res: WebsocketError) => {
          new EntityUtils().handleWsError(this, res, this.dialog);
          this.loader.close();
        },
      );
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
        this.ws.call(this.wsKeep, [id, { keep: true }]).pipe(untilDestroyed(this)).subscribe(
          () => {
            this.entityList.getData();
            this.loader.close();
            this.entityList.selection.clear();
          },
          (res: WebsocketError) => {
            new EntityUtils().handleWsError(this, res, this.dialog);
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
        this.ws.call(this.wsKeep, [id, { keep: false }]).pipe(untilDestroyed(this)).subscribe(
          () => {
            this.entityList.getData();
            this.loader.close();
            this.entityList.selection.clear();
          },
          (res: WebsocketError) => {
            new EntityUtils().handleWsError(this, res, this.dialog);
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
        const modal = this.slideInService.open(BootEnvironmentFormComponent);
        modal.setupForm(BootEnvironmentActions.Create);
      },
    }, {
      label: this.translate.instant('Stats/Settings'),
      onClick: () => this.matDialog.open(BootenvStatsDialogComponent),
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
      this.ws.call('boot.scrub').pipe(untilDestroyed(this)).subscribe(() => {
        this.loader.close();
        this.dialog.info(this.translate.instant('Scrub Started'), '', '300px', 'info', true);
      },
      (res: WebsocketError) => {
        new EntityUtils().handleWsError(this, res, this.dialog);
        this.loader.close();
      });
    });
  }
}
