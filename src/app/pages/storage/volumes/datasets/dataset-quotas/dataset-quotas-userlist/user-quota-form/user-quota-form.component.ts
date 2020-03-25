import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { T } from 'app/translate-marker';
import * as _ from 'lodash';
import { EntityFormComponent } from '../../../../../../common/entity/entity-form';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { DialogService, StorageService, WebSocketService, AppLoaderService, UserService } from 'app/services';
import helptext from 'app/helptext/storage/volumes/datasets/dataset-quotas';

@Component({
  selector: 'app-user-quota-form',
  template: `<entity-form [conf]="this"></entity-form>`
})
export class UserQuotaFormComponent {
  public isEntity = true;
  public entityForm: any;
  public pk: string;
  protected route_success: string[];
  public selectedUsers = [];
  public userField;

  public fieldConfig: FieldConfig[] = []
  public fieldSets: FieldSet[] = [
    {
      name: helptext.users.quota_title,
      label: true,
      width: '48%',
      config: [
        {
          type: 'input',
          name: 'user_data_quota',
          placeholder: helptext.users.data_quota.placeholder,
          tooltip: helptext.users.data_quota.tooltip,
          value: 0,
          blurStatus: true,
          blurEvent: this.userBlurEvent,
          parent: this,
        },
        {
          type: 'input',
          name: 'user_obj_quota',
          placeholder: helptext.users.obj_quota.placeholder,
          tooltip: helptext.users.obj_quota.tooltip,
          value: 0
        }
      ]
    },
    {
      name: 'vertical_divider',
      label: false,
      width: '2%',
      config: []
    },
    {
      name: helptext.users.user_title,
      label: true,
      width: '48%',
      config: [
        {
          type: 'select',
          name: 'system_users',
          placeholder: helptext.users.system_select.placeholder,
          tooltip: helptext.users.system_select.tooltip,
          multiple: true,
          options: [],
        },
        {
          type: 'chip',
          name: 'searched_users',
          placeholder: helptext.users.search.placeholder,
          tooltip: helptext.users.search.tooltip,
          value: this.selectedUsers,
          id: 'selected-users_chiplist',
          autocomplete: true,
          searchOptions: [],
          parent: this,
          updater: this.updateUserSearchOptions,
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
    protected router: Router, protected userService: UserService, private dialog: DialogService) { }

  preInit(entityForm: EntityFormComponent) {
    const paramMap: any = (<any>this.aroute.params).getValue();
    this.pk = paramMap.pk;
  }

  async validateUser(value) {
    const validUser = await this.userService.getUserObject(value);
    if (!validUser) {
      this.dialog.Info('Unknown User', `${value} is not a valid user.`)
      // const c = (<HTMLInputElement>document.getElementById('mat-chip-list-0').lastChild);
      // c.childNodes[c.childNodes.length-3].classList.add('chip-warn')
    } else {
      console.log(validUser)
    }
  }

  afterInit(entityEdit: any) {
    this.entityForm = entityEdit;
    this.route_success = ['storage', 'pools', 'user-quotas', this.pk];
    const users = _.find(this.fieldConfig, {name: "system_users"});
    this.userField = _.find(this.fieldSets.find(set => set.name === helptext.users.user_title).config,
      { 'name': 'searched_users' });


    this.ws.call('user.query').subscribe(res => {
      res.map(user => {
        users.options.push({label: user.username, value: user.uid})
      });
    });

    this.entityForm.formGroup.controls['searched_users'].valueChanges.subscribe(value => {
      if (value) {
        console.log(value)
        this.validateUser(value[value.length - 1])
      }
    })

    entityEdit.formGroup.controls['user_data_quota'].valueChanges.subscribe((value) => {
      const formField = _.find(this.fieldConfig, { name: 'user_data_quota' });
      const filteredValue = value ? this.storageService.convertHumanStringToNum(value, false, 'kmgtp') : undefined;
      formField['hasErrors'] = false;
      formField['errors'] = '';
      if (filteredValue !== undefined && isNaN(filteredValue)) {
        formField['hasErrors'] = true;
        formField['errors'] = helptext.shared.input_error;
      };
    })
  }

  userBlurEvent(parent) {
    if (parent.entityForm && parent.storageService.humanReadable) {
      parent.transformValue(parent, 'user_data_quota');
    }
  }

  transformValue(parent, fieldname: string) {
    parent.entityForm.formGroup.controls[fieldname].setValue(parent.storageService.humanReadable || 0);
    parent.storageService.humanReadable = '';
  }

  updateUserSearchOptions(value = "", parent) {
    parent.userService.userQueryDSCache(value).subscribe(items => {
      const users = [];
      for (let i = 0; i < items.length; i++) {
        users.push({ label: items[i].username, value: items[i].username });
      }
      console.log(users)
      parent.userField.searchOptions = users;
    });
  }

  customSubmit(data) {
    const payload = [];

    console.log(data)
    if (data.searched_users.length > 0) {
      data.searched_users.forEach(user => {
        if (!data.system_users.includes(user)) {
          data.system_users.push(user)
        }
      })
    }

    if (data.system_users) {
      data.system_users.forEach((user) => {
        payload.push({
          quota_type: 'USER',
          id: user.toString(),
          quota_value: this.storageService.convertHumanStringToNum(data.user_data_quota)
        },
        {
          quota_type: 'USEROBJ',
          id: user.toString(),
          quota_value: parseInt(data.user_obj_quota, 10)
        })
      });
    }
    console.log(payload)
    this.loader.open();
    this.ws.call('pool.dataset.set_quota', [this.pk, payload]).subscribe(res => {
      this.loader.close();
      this.router.navigate(new Array('/').concat(this.route_success));
    }, err => {
      this.loader.close();
      this.dialog.errorReport('Error', err.reason, err.trace.formatted)
    })
  }





}
