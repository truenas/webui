import { Component, OnDestroy } from '@angular/core';
import { ValidationErrors, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import globalHelptext from 'app/helptext/global-helptext';
import helptext from 'app/helptext/storage/volumes/datasets/dataset-quotas';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityTableAction, EntityTableConfig } from 'app/pages/common/entity/entity-table/entity-table.interface';
import {
  WebSocketService, StorageService, DialogService, AppLoaderService,
} from 'app/services';
import { T } from 'app/translate-marker';

@UntilDestroy()
@Component({
  selector: 'app-dataset-quotas-userlist',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
})
export class DatasetQuotasUserlistComponent implements EntityTableConfig, OnDestroy {
  pk: string;
  title = helptext.users.table_title;
  protected entityList: any;
  quotaValue: number;
  protected fullFilter = [['OR', [['used_bytes', '>', 0], ['obj_used', '>', 0]]]];
  protected emptyFilter: string[] = [];
  protected useFullFilter = true;

  columns = [
    {
      name: T('Name'), prop: 'name', always_display: true, minWidth: 150,
    },
    { name: T('ID'), prop: 'id', hidden: true },
    { name: T('Data Quota'), prop: 'quota', hidden: false },
    { name: T('DQ Used'), prop: 'used_bytes', hidden: false },
    { name: T('DQ % Used'), prop: 'used_percent', hidden: false },
    { name: T('Object Quota'), prop: 'obj_quota', hidden: false },
    { name: T('Objects Used'), prop: 'obj_used', hidden: false },
    { name: T('OQ % Used'), prop: 'obj_used_percent', hidden: false },
  ];
  rowIdentifier = 'name';
  config: any = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: T('User'),
      key_props: ['name'],
    },
  };

  constructor(protected ws: WebSocketService, protected storageService: StorageService,
    protected dialogService: DialogService, protected loader: AppLoaderService,
    protected router: Router, protected aroute: ActivatedRoute,
    private translate: TranslateService) { }

  getAddActions(): EntityTableAction[] {
    return [{
      label: T('Toggle Display'),
      onClick: () => {
        this.toggleDisplay();
      },
    },
    {
      label: T('Set Quotas (Bulk)'),
      onClick: () => {
        this.router.navigate(['storage', 'user-quotas-form', this.pk]);
      },
    },
    ] as EntityTableAction[];
  }

  getActions(row: any): EntityTableAction[] {
    const self = this;
    const actions = [];
    actions.push({
      id: row.path,
      icon: 'edit',
      label: T('Edit'),
      name: 'edit',
      onClick: () => {
        self.loader.open();
        self.ws.call('pool.dataset.get_quota', [self.pk, 'USER', [['id', '=', row.id]]]).pipe(untilDestroyed(this)).subscribe((res) => {
          self.loader.close();
          const conf: DialogFormConfiguration = {
            title: helptext.users.dialog.title,
            fieldConfig: [
              {
                type: 'input',
                name: 'name',
                placeholder: helptext.users.dialog.user.placeholder,
                value: res[0].name,
                readonly: true,
              },
              {
                type: 'input',
                name: 'data_quota',
                placeholder: helptext.users.data_quota.placeholder,
                tooltip: `${helptext.users.data_quota.tooltip} bytes.`,
                value: self.storageService.convertBytestoHumanReadable(res[0].quota, 0, null, true),
                id: 'data-quota_input',
                blurStatus: true,
                blurEvent: self.blurEvent,
                parent: self,
                validation: [
                  (control: FormControl): ValidationErrors => {
                    const config = conf.fieldConfig.find((c) => c.name === 'data_quota');
                    self.quotaValue = control.value;
                    const size = self.storageService.convertHumanStringToNum(control.value);
                    const errors = control.value && isNaN(size)
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
                placeholder: helptext.users.obj_quota.placeholder,
                tooltip: helptext.users.obj_quota.tooltip,
                value: res[0].obj_quota,
              },
            ],
            saveButtonText: helptext.shared.set,
            cancelButtonText: helptext.shared.cancel,

            customSubmit(data: any) {
              const entryData = data.formValue;
              const payload = [];
              payload.push({
                quota_type: 'USER',
                id: res[0].id,
                quota_value: self.storageService.convertHumanStringToNum(entryData.data_quota),
              },
              {
                quota_type: 'USEROBJ',
                id: res[0].id,
                quota_value: entryData.obj_quota,
              });
              self.loader.open();
              self.ws.call('pool.dataset.set_quota', [self.pk, payload]).pipe(untilDestroyed(this)).subscribe(() => {
                self.loader.close();
                self.dialogService.closeAllDialogs();
                self.entityList.getData();
              }, (err) => {
                self.loader.close();
                self.dialogService.errorReport(T('Error'), err.reason, err.trace.formatted);
              });
            },
          };
          this.dialogService.dialogFormWide(conf);
        }, (err) => {
          self.loader.close();
          self.dialogService.errorReport(T('Error'), err.reason, err.trace.formatted);
        });
      },
    });
    return actions as EntityTableAction[];
  }

  preInit(entityList: any): void {
    this.entityList = entityList;
    const paramMap: any = (<any> this.aroute.params).getValue();
    this.pk = paramMap.pk;
    this.useFullFilter = window.localStorage.getItem('useFullFilter') !== 'false';
  }

  callGetFunction(entityList: any): void {
    const filter = this.useFullFilter ? this.fullFilter : this.emptyFilter;
    this.ws.call('pool.dataset.get_quota', [this.pk, 'USER', filter]).pipe(untilDestroyed(this)).subscribe((res) => {
      entityList.handleData(res, true);
    });
  }

  dataHandler(data: any): void {
    this.translate.get(helptext.shared.nameErr).pipe(untilDestroyed(this)).subscribe((msg) => {
      data.rows.forEach((row: any) => {
        if (!row.name) {
          row.name = `*ERR* (${msg}), ID: ${row.id}`;
        }
        row.quota = this.storageService.convertBytestoHumanReadable(row.quota, 0);
        if (row.used_bytes !== 0) {
          row.used_bytes = this.storageService.convertBytestoHumanReadable(row.used_bytes, 2);
        }
        row.used_percent = `${Math.round((row.used_percent) * 100) / 100}%`;
        row.obj_used_percent = `${Math.round((row.obj_used_percent) * 100) / 100}%`;
      });
      return data;
    });
  }

  blurEvent(parent: any): void {
    (<HTMLInputElement>document.getElementById('data-quota_input')).value = parent.storageService.humanReadable;
  }

  toggleDisplay(): void {
    let title; let message; let button;
    if (this.useFullFilter) {
      title = helptext.users.filter_dialog.title_show;
      message = helptext.users.filter_dialog.message_show;
      button = helptext.users.filter_dialog.button_show;
    } else {
      title = helptext.users.filter_dialog.title_filter;
      message = helptext.users.filter_dialog.message_filter;
      button = helptext.users.filter_dialog.button_filter;
    }
    this.dialogService.confirm(title, message, true, button).pipe(untilDestroyed(this)).subscribe((res: boolean) => {
      if (res) {
        this.entityList.loader.open();
        this.useFullFilter = !this.useFullFilter;
        window.localStorage.setItem('useFullFilter', this.useFullFilter.toString());
        this.entityList.needTableResize = false;
        this.entityList.getData();
        this.loader.close();
      }
    });
  }

  ngOnDestroy(): void {
    window.localStorage.setItem('useFullFilter', 'true');
  }
}
