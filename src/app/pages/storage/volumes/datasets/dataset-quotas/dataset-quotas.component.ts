import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { EntityFormComponent } from '../../../../common/entity/entity-form';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { StorageService, WebSocketService, AppLoaderService } from '../../../../../services/';
import  helptext  from 'app/helptext/storage/volumes/datasets/dataset-quotas';

@Component({
  selector: 'app-dataset-quotas',
  templateUrl : './dataset-quotas.component.html',
})
export class DatasetQuotasComponent {
  title = 'User and Group Quotas'
  selectedUsers = [];
  selectedUserNames = [];

  db: string;

  public isEntity = true;
  public route_success: string[] = [ 'storage', 'pools' ];
  public entityForm: any;
  public dataFields = ['user_data_quota', ];
  public pk: string;

  public fieldConfig: FieldConfig[] = []
  public fieldSets: FieldSet[] = [
    {
      name: 'Selected Users',
      label: true,
      width: '48%',
      config: [
        {
          type: 'textarea',
          name: 'selected_users',
          placeholder: 'Selected Users',
          tooltip: '',
        },
      ]
    },
    {
      name: 'vertical_divider',
      label: false,
      width: '2%',
      config: []
    },
    {
      name: 'Settings',
      label: true,
      width: '48%',
      config: [
        {
          type: 'select',
          name: 'user',
          placeholder: helptext.users.placeholder,
          tooltip: helptext.users.tooltip,
          multiple: true,
          isHidden: true,
          options: [],
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
          isLoading: true
        },
        {
          type: 'input',
          name: 'user_obj_quota',
          placeholder: helptext.users.obj_placeholder,
          tooltip: helptext.users.obj_tooltip,
          value: 0
        }
      ]
    },
    {
      name: 'divider',
      divider: true
    }
  ];

  constructor(protected ws: WebSocketService, protected storageService: StorageService,
    protected aroute: ActivatedRoute, protected loader: AppLoaderService,
    protected router: Router) { }

  preInit(entityForm: EntityFormComponent) {
    const paramMap: any = (<any>this.aroute.params).getValue();
    this.pk = paramMap.pk;
    this.db = this.pk;
  }

  afterInit(entityEdit: any) {
    this.entityForm = entityEdit;
    const users = _.find(this.fieldConfig, {name: "user"});

    this.ws.call('user.query').subscribe(res => {
      res.map(user => {
        users.options.push({label: user.username, value: user.uid})
      });

      this.ws.call('pool.dataset.get_quota', [this.pk, 'USER']).subscribe(res => {
        let names = []
        const userName = entityEdit.formGroup.controls['user'];
        const userDataQuota = entityEdit.formGroup.controls['user_data_quota'];
        const userObjQuota = entityEdit.formGroup.controls['user_obj_quota'];
        res.map(user => {
          names.push(user.id);
          userDataQuota.setValue(this.storageService.convertBytestoHumanReadable(user.quota, 0));
          userObjQuota.setValue(user.obj_quota);
        })
        userName.setValue(names);
        _.find(this.fieldConfig, {name: 'user_data_quota'}).isLoading = false;
      }, 
      err => {
        console.log(err)
      });
    });

    this.dataFields.forEach(field => 
      entityEdit.formGroup.controls[field].valueChanges.subscribe((value) => {
        const formField = _.find(this.fieldConfig, { name: field });
        const filteredValue = value ? this.storageService.convertHumanStringToNum(value, false, 'kmgtp') : undefined;
        formField['hasErrors'] = false;
        formField['errors'] = '';
        if (filteredValue !== undefined && isNaN(filteredValue)) {
          formField['hasErrors'] = true;
          formField['errors'] = helptext.shared.input_error;
        };
      })
    );
  }

  userBlurEvent(parent) {
    if (parent.entityForm && parent.storageService.humanReadable) {
      parent.transformValue(parent, 'user_data_quota');
    }
  }

  groupBlurEvent(parent) {
    if (parent.entityForm && parent.storageService.humanReadable) {
      parent.transformValue(parent, 'group_data_quota');
    }
  }

  transformValue(parent, fieldname: string) {
    parent.entityForm.formGroup.controls[fieldname].setValue(parent.storageService.humanReadable || 0);
    // Clear humanReadable value to keep from accidentally setting it elsewhere
    parent.storageService.humanReadable = '';
  }

  customSubmit(data) {
    data.user = [];
    this.selectedUsers.map(user => {
      data.user.push(user.id)
    })
    let payload = [];
    if (data.user) {
      data.user.forEach((user) => {
        payload.push({
          quota_type: 'USER',
          id: user.toString(),
          quota_value: this.storageService.convertHumanStringToNum(data.user_data_quota)
        },
        {
          quota_type: 'USEROBJ',
          id: user.toString(),
          quota_value: data.user_obj_quota
        })
      });
    }
    console.log(payload)
    this.loader.open();
    this.ws.call('pool.dataset.set_quota', [this.pk, payload]).subscribe(res => {
      this.loader.close();
      this.router.navigate(new Array('/').concat(this.route_success));
    })
  }

  listUsers(users) {
    users.map(user => {
      if (!this.selectedUserNames.includes(user.username)) {
      this.selectedUserNames.push(user.username);
      this.selectedUsers.push({username:user.username, id: user.uid})
      }
    })
  }
}
