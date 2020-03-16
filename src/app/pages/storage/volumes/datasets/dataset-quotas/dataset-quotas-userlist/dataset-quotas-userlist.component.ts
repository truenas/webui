import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { WebSocketService, StorageService, DialogService, AppLoaderService } from '../../../../../../services';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import helptext from 'app/helptext/storage/volumes/datasets/dataset-quotas';

@Component({
  selector: 'app-dataset-quotas-userlist',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`,
})
export class DatasetQuotasUserlistComponent {
  public title = "Dataset Users";
  protected entityList: any;
  protected hasDetails = false;
  protected noActions = true;
  protected queryCall = 'user.query';
  public columnFilter = false;
  public pk: string;

  public columns: Array < any > = [
    { name: 'Username', prop: 'username', always_display: true, minWidth: 150},
    { name: 'UID', prop: 'uid', hidden: false },
    { name: 'Data Quota', prop: 'quota', hidden: false },
    { name: 'DQ % Used', prop: 'used_percent', hidden: false  },
    { name: 'Object Quota', prop: 'obj_quota', hidden: false },
    { name: 'OQ % Used', prop: 'obj_used_percent', hidden: false  },

  ];
  public rowIdentifier = 'username';
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
    multiSelect: true,
    deleteMsg: {
      title: 'User',
      key_props: ['username']
    }
  };

  public multiActions: Array < any > = [{
    id: "addToForm",
    label: ("Add to Form"),
    icon: "add",
    enable: true,
    ttpos: "above",
    onClick: (selected) => {
      const self = this;
      const userNames = [];
      const uids = [];
      let users = '';
      selected.map(user => {
        userNames.push(user.username);
        uids.push(user.uid);
      })
      users = userNames.join(', ');
      const conf: DialogFormConfiguration = {
        title: ('Set quotas on selected users'),
        fieldConfig: [
          {
            type: 'textarea',
            name: 'selected_users',
            placeholder: ('Selected Users'),
            tooltip: 'Users are selected in the table. This list must be edited there. A quota change will apply to all of them.',
            value: users,
            readonly: true
          },
          {
            type: 'input',
            name: 'user_data_quota',
            placeholder: helptext.users.data_placeholder,
            tooltip: helptext.users.data_tooltip,
            value: 0,
            blurStatus: true,
            blurEvent: self.userBlurEvent,
            parent: self,
          },
          {
            type: 'input',
            name: 'user_obj_quota',
            placeholder: helptext.users.obj_placeholder,
            tooltip: helptext.users.obj_tooltip,
            value: 0
          }
        ],
        saveButtonText: ('SET QUOTAS'),
        cancelButtonText: ('CANCEL'),

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
                quota_value: userData.user_data_quota
              },
              {
                quota_type: 'USEROBJ',
                id: user.toString(),
                quota_value: userData.user_obj_quota
              })
            });
          }
          console.log(payload)
          self.loader.open();
          self.ws.call('pool.dataset.set_quota', [self.pk, payload]).subscribe(res => {
            console.log(res)
            self.loader.close();
            self.dialogService.closeAllDialogs();
            self.entityList.getData();
            selected.length = 0;
          })
        }
      }
      this.dialogService.dialogFormWide(conf);

    }
  }];

  constructor(protected ws: WebSocketService, protected storageService: StorageService,
    protected dialogService: DialogService, protected loader: AppLoaderService,
    protected router: Router, protected aroute: ActivatedRoute) { }

  resourceTransformIncomingRestData(data) {
    this.ws.call('pool.dataset.get_quota', [this.pk, 'USER']).subscribe(res => {
      data.map(item => {
        res.map(i => {
          if(item.username === i.name) {
            item.quota = this.storageService.convertBytestoHumanReadable(i.quota, 0);
            item.used = i.used_percent;
            item.obj_quota = i.obj_quota;
            item.obj_used_percent = i.obj_used_percent;
          }
        })
      })
    })
    return data;
  }

  preInit(entityList) {
    this.entityList = entityList;
    const paramMap: any = (<any>this.aroute.params).getValue();
    this.pk = paramMap.pk;
  }

  userBlurEvent(parent) { console.log(parent)
    if (parent.storageService.humanReadable) {
      console.log('yes')
      parent.transformValue(parent, 'user_data_quota');
    }
  }

}
