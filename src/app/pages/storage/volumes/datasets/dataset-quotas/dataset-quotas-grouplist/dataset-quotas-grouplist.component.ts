import { Component, OnDestroy } from '@angular/core';
import { FormControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { DatasetQuotaType } from 'app/enums/dataset-quota-type.enum';
import globalHelptext from 'app/helptext/global-helptext';
import helptext from 'app/helptext/storage/volumes/datasets/dataset-quotas';
import { DatasetQuota } from 'app/interfaces/dataset-quota.interface';
import { QueryFilter, QueryParams } from 'app/interfaces/query-api.interface';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/pages/common/entity/entity-dialog/entity-dialog.component';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table/entity-table.component';
import { EntityTableAction, EntityTableConfig } from 'app/pages/common/entity/entity-table/entity-table.interface';
import { DatasetQuotaRow } from 'app/pages/storage/volumes/datasets/dataset-quotas/dataset-quotas-grouplist/dataset-quota-row.interface';
import {
  AppLoaderService, DialogService, StorageService, WebSocketService,
} from 'app/services';

@UntilDestroy()
@Component({
  selector: 'app-dataset-quotas-grouplist',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
})
export class DatasetQuotasGrouplistComponent implements EntityTableConfig, OnDestroy {
  pk: string;
  title = helptext.groups.table_title;
  protected entityList: EntityTableComponent;
  quotaValue: number;
  protected fullFilter: QueryParams<DatasetQuota> = [['OR', [['quota', '>', 0], ['obj_quota', '>', 0]]]];
  protected emptyFilter: QueryParams<DatasetQuota> = [];
  protected useFullFilter = true;
  routeAdd: string[];

  columns = [
    {
      name: this.translate.instant('Name'), prop: 'name', always_display: true, minWidth: 150,
    },
    { name: this.translate.instant('ID'), prop: 'id', hidden: true },
    { name: this.translate.instant('Data Quota'), prop: 'quota', hidden: false },
    { name: this.translate.instant('DQ Bytes Used'), prop: 'used_bytes', hidden: false },
    { name: this.translate.instant('DQ % Used'), prop: 'used_percent', hidden: false },
    { name: this.translate.instant('Object Quota'), prop: 'obj_quota', hidden: false },
    { name: this.translate.instant('OQ Objs Used'), prop: 'obj_used', hidden: false },
    { name: this.translate.instant('OQ % Used'), prop: 'obj_used_percent', hidden: false },
  ];
  rowIdentifier = 'name';
  config = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: this.translate.instant('Group'),
      key_props: ['name'],
    },
  };

  constructor(protected ws: WebSocketService, protected storageService: StorageService,
    protected dialogService: DialogService, protected loader: AppLoaderService,
    protected router: Router, protected aroute: ActivatedRoute,
    private translate: TranslateService) { }

  getAddActions(): EntityTableAction[] {
    return [{
      label: this.translate.instant('Toggle Display'),
      onClick: () => {
        this.toggleDisplay();
      },
    },
    ] as EntityTableAction[];
  }

  getActions(row: DatasetQuotaRow): EntityTableAction[] {
    const actions = [];
    actions.push({
      icon: 'edit',
      label: this.translate.instant('Edit'),
      name: 'edit',
      onClick: () => {
        this.loader.open();
        const params = [['id', '=', row.id] as QueryFilter<DatasetQuota>] as QueryParams<DatasetQuota>;
        this.ws.call('pool.dataset.get_quota', [this.pk, DatasetQuotaType.Group, params]).pipe(untilDestroyed(this)).subscribe((res) => {
          this.loader.close();
          const conf: DialogFormConfiguration<this> = {
            title: helptext.groups.dialog.title,
            fieldConfig: [
              {
                type: 'input',
                name: 'name',
                placeholder: helptext.groups.dialog.group.placeholder,
                value: res[0].name,
                readonly: true,
              },
              {
                type: 'input',
                name: 'data_quota',
                placeholder: this.translate.instant(helptext.groups.data_quota.placeholder)
                + this.translate.instant(globalHelptext.human_readable.suggestion_label),
                tooltip: this.translate.instant(helptext.groups.data_quota.tooltip)
                + this.translate.instant(globalHelptext.human_readable.suggestion_tooltip)
                + this.translate.instant(' bytes.'),
                value: this.storageService.convertBytestoHumanReadable(res[0].quota, 0, null, true),
                id: 'data-quota_input',
                blurStatus: true,
                blurEvent: () => this.blurEvent(),
                parent: this,
                validation: [
                  (control: FormControl): ValidationErrors => {
                    const config = conf.fieldConfig.find((c) => c.name === 'data_quota');
                    this.quotaValue = control.value;
                    const size = this.storageService.convertHumanStringToNum(control.value);
                    const errors = control.value && Number.isNaN(size)
                      ? { invalid_byte_string: true }
                      : null;

                    if (errors) {
                      config.hasErrors = true;
                      config.errors = globalHelptext.human_readable.input_error;
                    } else {
                      config.hasErrors = false;
                      config.errors = '';
                    }
                    return errors;
                  },
                ],
              },
              {
                type: 'input',
                name: 'obj_quota',
                placeholder: helptext.groups.obj_quota.placeholder,
                tooltip: helptext.groups.obj_quota.tooltip,
                value: res[0].obj_quota,
              },
            ],
            saveButtonText: helptext.shared.set,
            cancelButtonText: helptext.shared.cancel,

            customSubmit: (data: EntityDialogComponent) => {
              const entryData = data.formValue;
              const payload = [];
              payload.push({
                quota_type: DatasetQuotaType.Group,
                id: String(res[0].id),
                quota_value: this.storageService.convertHumanStringToNum(entryData.data_quota),
              },
              {
                quota_type: DatasetQuotaType.GroupObj,
                id: String(res[0].id),
                quota_value: entryData.obj_quota,
              });
              this.loader.open();
              this.ws.call('pool.dataset.set_quota', [this.pk, payload]).pipe(untilDestroyed(this)).subscribe(() => {
                this.loader.close();
                this.dialogService.closeAllDialogs();
                this.entityList.getData();
              }, (err) => {
                this.loader.close();
                this.dialogService.errorReport(this.translate.instant('Error'), err.reason, err.trace.formatted);
              });
            },
          };
          this.dialogService.dialogFormWide(conf);
        }, (err) => {
          this.loader.close();
          this.dialogService.errorReport(this.translate.instant('Error'), err.reason, err.trace.formatted);
        });
      },
    });
    return actions as EntityTableAction[];
  }

  preInit(entityList: EntityTableComponent): void {
    this.entityList = entityList;
    const paramMap = this.aroute.snapshot.params;
    this.pk = paramMap.pk;
    this.routeAdd = ['storage', 'group-quotas-form', this.pk];
    this.useFullFilter = window.localStorage.getItem('useFullFilter') !== 'false';
  }

  callGetFunction(entityList: EntityTableComponent): void {
    const filter = this.useFullFilter ? this.fullFilter : this.emptyFilter;
    this.ws.call('pool.dataset.get_quota', [this.pk, DatasetQuotaType.Group, filter]).pipe(untilDestroyed(this)).subscribe((res) => {
      entityList.handleData(res, true);
    });
  }

  dataHandler(data: EntityTableComponent): void {
    data.rows = data.rows.map((row: DatasetQuota) => {
      return {
        ...row,
        name: row.name
          ? row.name
          : `*ERR* (${this.translate.instant(helptext.shared.nameErr)}), ID: ${row.id}`,
        quota: this.storageService.convertBytestoHumanReadable(row.quota, 0),
        used_percent: `${Math.round((row.used_percent) * 100) / 100}%`,
        obj_used_percent: `${Math.round((row.obj_used_percent) * 100) / 100}%`,
      };
    });
  }

  blurEvent(): void {
    (document.getElementById('data-quota_input') as HTMLInputElement).value = this.storageService.humanReadable;
  }

  toggleDisplay(): void {
    let title; let message; let button;
    if (this.useFullFilter) {
      title = helptext.groups.filter_dialog.title_show;
      message = helptext.groups.filter_dialog.message_show;
      button = helptext.groups.filter_dialog.button_show;
    } else {
      title = helptext.groups.filter_dialog.title_filter;
      message = helptext.groups.filter_dialog.message_filter;
      button = helptext.groups.filter_dialog.button_filter;
    }
    this.dialogService.confirm({
      title,
      message,
      hideCheckBox: true,
      buttonMsg: button,
    }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.entityList.loader.open();
      this.useFullFilter = !this.useFullFilter;
      window.localStorage.setItem('useFullFilter', this.useFullFilter.toString());
      this.entityList.getData();
      this.loader.close();
    });
  }

  ngOnDestroy(): void {
    window.localStorage.setItem('useFullFilter', 'true');
  }
}
