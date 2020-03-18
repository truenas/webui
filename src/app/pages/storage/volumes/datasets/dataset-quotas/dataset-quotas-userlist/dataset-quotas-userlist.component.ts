import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { WebSocketService, StorageService, DialogService, AppLoaderService } from '../../../../../../services';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import { ValidationErrors, FormControl } from '@angular/forms';
import { T } from '../../../../../../translate-marker';
import helptext from 'app/helptext/storage/volumes/datasets/dataset-quotas';
import globalHelptext from '../../../../../../helptext/global-helptext';

@Component({
  selector: 'app-dataset-quotas-userlist',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`,
})
export class DatasetQuotasUserlistComponent {
  public title = helptext.users.title;
  protected entityList: any;
  protected hasDetails = false;
  protected noActions = true;
  public columnFilter = false;
  public pk: string;
  public quotaValue: number;

  public columns: Array < any > = [
    { name: T('Username'), prop: 'name', always_display: true, minWidth: 150},
    { name: T('UID'), prop: 'id', hidden: false },
    { name: T('Data Quota'), prop: 'quota', hidden: false },
    { name: T('DQ % Used'), prop: 'used_percent', hidden: false  },
    { name: T('Object Quota'), prop: 'obj_quota', hidden: false },
    { name: T('OQ % Used'), prop: 'obj_used_percent', hidden: false  },
  ];
  public rowIdentifier = 'name';
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
    multiSelect: true,
    deleteMsg: {
      title: T('User'),
      key_props: ['name']
    }
  };

  public multiActions: Array < any > = [{
    id: "addToForm",
    label: helptext.users.action_label,
    icon: "add",
    enable: true,
    ttpos: "above",
    onClick: (selected) => {
      const self = this;
      const userNames = [];
      const uids = [];
      let users = '';
      let dataQuota = 0;
      let objQuota = 0;
      selected.map(user => {
        userNames.push(user.name);
        uids.push(user.id);
        if (selected.length === 1) {
          dataQuota = user.quota;
          objQuota = user.obj_quota;
        }
      })
      users = userNames.join(', ');
      const conf: DialogFormConfiguration = {
        title: helptext.users.dialog.title,
        fieldConfig: [
          {
            type: 'textarea',
            name: 'selected_users',
            placeholder: helptext.users.dialog.list.placeholder,
            tooltip: helptext.users.dialog.list.tooltip,
            value: users,
            readonly: true
          },
          {
            type: 'input',
            name: 'user_data_quota',
            placeholder: helptext.users.dialog.data_quota.placeholder,
            tooltip: helptext.users.dialog.data_quota.tooltip,
            value: dataQuota,
            id: 'user-data-quota_input',
            blurStatus: true,
            blurEvent: self.userBlurEvent,
            parent: self,
            validation: [
              (control: FormControl): ValidationErrors => {
                const config = conf.fieldConfig.find(c => c.name === 'user_data_quota');
                self.quotaValue = control.value;
                const size = self.storageService.convertHumanStringToNum(control.value);
                const errors = control.value && isNaN(size)
                  ? { invalid_byte_string: true }
                  : null

                if (errors) {
                  config.hasErrors = true;
                  config.errors = globalHelptext.human_readable.input_error;
                } else {
                  config.hasErrors = false;
                    config.errors = '';
                }
                return errors;
              }
            ],
          },
          {
            type: 'input',
            name: 'user_obj_quota',
            placeholder: helptext.users.dialog.obj_quota.placeholder,
            tooltip: helptext.users.dialog.obj_quota.tooltip,
            value: objQuota
          }
        ],
        saveButtonText: helptext.shared.set,
        cancelButtonText: helptext.shared.cancel,

        customSubmit(data) {
          const userData = data.formValue;
          userData.user = [];
          uids.map(uid => {
            userData.user.push(uid)
          })
          const payload = [];
          if (userData.user) {
            userData.user.forEach((user) => {
              payload.push({
                quota_type: 'USER',
                id: user.toString(),
                quota_value: self.storageService.convertHumanStringToNum(userData.user_data_quota)
              },
              {
                quota_type: 'USEROBJ',
                id: user.toString(),
                quota_value: userData.user_obj_quota
              })
            });
          }
          self.loader.open();
          self.ws.call('pool.dataset.set_quota', [self.pk, payload]).subscribe(res => {
            self.loader.close();
            self.dialogService.closeAllDialogs();
            self.entityList.getData();
            selected.length = 0;
          }, err => {
            self.loader.close();
            self.dialogService.errorReport(T('Error'), err.reason, err.trace.formatted);
          })
        }
      }
      this.dialogService.dialogFormWide(conf);

    }
  }];

  constructor(protected ws: WebSocketService, protected storageService: StorageService,
    protected dialogService: DialogService, protected loader: AppLoaderService,
    protected router: Router, protected aroute: ActivatedRoute) { }

  preInit(entityList) {
    this.entityList = entityList;
    const paramMap: any = (<any>this.aroute.params).getValue();
    this.pk = paramMap.pk;
  }

  callGetFunction(entityList) {
    this.ws.call('pool.dataset.get_quota', [this.pk, 'USER']).subscribe(res => {
      entityList.handleData(res);
    })
  }

  dataHandler(data): void {
    data.rows.forEach(row => {
      row.quota = this.storageService.convertBytestoHumanReadable(row.quota, 0);
      row.used_percent = `${Math.round((row.used_percent) * 100) / 100}%`;
      row.obj_used_percent = `${Math.round((row.obj_used_percent) * 100) / 100}%`;
    })
    return data;
  }

  userBlurEvent(parent) {
    (<HTMLInputElement>document.getElementById('user-data-quota_input')).value =
      parent.storageService.humanReadable;
  }

}
