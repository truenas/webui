import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { WebSocketService, StorageService, DialogService, AppLoaderService } from '../../../../../../services';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import helptext from 'app/helptext/storage/volumes/datasets/dataset-quotas';

@Component({
  selector: 'app-dataset-quotas-userlist',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`,
  styleUrls: ['./dataset-quotas-userlist.component.css']
})
export class DatasetQuotasUserlistComponent implements OnInit {
  @Input() db;
  @Output() selectedUsers = new EventEmitter<any>();

  public title = "Dataset Users";
  protected entityList: any;
  protected hasDetails = false;
  protected noActions = true;
  protected queryCall = 'user.query';
  columnFilter = false;

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
      this.selectedUsers.emit(selected);
      const userNames = [];
      const uids = [];
      selected.map(user => {
        userNames.push(user.username);
        uids.push(user.uid);
      })
      const users = userNames.join(', ');
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
            blurEvent: this.userBlurEvent,
            parent: this,
          },
          {
            type: 'input',
            name: 'user_obj_quota',
            placeholder: helptext.users.obj_placeholder,
            tooltip: helptext.users.obj_tooltip,
            value: 0
          }
        ],
        method_ws: 'pool.dataset.set_quota',
        saveButtonText: ('SET QUOTAS'),
        cancelButtonText: ('CANCEL'),
        parent: this,
        customSubmit(data) {
          console.log(uids)
          const userData = data.formValue;
          console.log(userData)
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
          self.ws.call('pool.dataset.set_quota', [this.pk, payload]).subscribe(res => {
            self.loader.close();
            // self.router.navigate(new Array('/').concat(this.route_success));
          })
        }
      }
      this.dialogService.dialogFormWide(conf);

    }
  }];

  constructor(protected ws: WebSocketService, protected storageService: StorageService,
    protected dialogService: DialogService, protected loader: AppLoaderService,
    protected router: Router) { }

  resourceTransformIncomingRestData(data) {
    this.ws.call('pool.dataset.get_quota', [this.db, 'USER']).subscribe(res => {
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

  // saveWhatevs() {
  //   console.log('whatevs')
  // }

  ngOnInit(): void {}

  userBlurEvent(parent) {
    if (parent.entityForm && parent.storageService.humanReadable) {
      parent.transformValue(parent, 'user_data_quota');
    }
  }

}
