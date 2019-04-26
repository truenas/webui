import {
  Component,
  OnDestroy,
} from '@angular/core';
import {
  FormGroup,
} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';

import { UserService } from '../../../../../services/user.service';
import {RestService, WebSocketService, StorageService, DialogService} from '../../../../../services/';
import {EntityUtils} from '../../../../common/entity/utils';
import {
  FieldConfig
} from '../../../../common/entity/entity-form/models/field-config.interface';
import { T } from '../../../../../translate-marker';
import helptext from '../../../../../helptext/storage/volumes/datasets/dataset-acl';


@Component({
  selector : 'app-dataset-acl',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class DatasetAclComponent implements OnDestroy {

  protected queryCall = 'filesystem.getacl';
  protected updateCall = 'filesystem.setacl';
  protected path: string;
  protected userOptions: any[];
  protected groupOptions: any[];
  protected userSearchOptions: [];
  protected groupSearchOptions: [];
  protected path_fc: any;
  protected recursive: any;
  protected recursive_subscription: any;
  private acl: any;
  public sub: Subscription;
  public formGroup: FormGroup;
  public data: Object = {};
  public error: string;
  public busy: Subscription;
  protected fs: any = (<any>window).filesize;
  protected route_success: string[] = [ 'storage', 'pools' ];

  public fieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name : 'path',
      placeholder : helptext.dataset_acl_path_placeholder,
      readonly: true
    },
    {
      type: 'list',
      name: 'aces',
      placeholder: helptext.dataset_acl_aces_placeholder,
      templateListField: [
        {
          type: 'select',
          name: 'tag',
          placeholder: helptext.dataset_acl_tag_placeholder,
          options: helptext.dataset_acl_tag_options,
          tooltip: helptext.dataset_acl_tag_tooltip,
          class: 'inline-block'
        },
        {
          type: 'combobox',
          name: 'user',
          placeholder: helptext.dataset_acl_user_placeholder,
          tooltip: helptext.dataset_acl_user_tooltip,
          options: this.userOptions,
          searchOptions: this.userSearchOptions,
          parent: this,
          updater: this.updateUserSearchOptions,
          disabled: false,
          isHidden: false,
          class: 'inline-block',
        },
        {
          type: 'combobox',
          name: 'group',
          placeholder: helptext.dataset_acl_group_placeholder,
          tooltip: helptext.dataset_acl_group_tooltip,
          options: this.groupOptions,
          searchOptions: this.groupSearchOptions,
          parent: this,
          updater: this.updateGroupSearchOptions,
          disabled: false,
          isHidden: false,
          class: 'inline-block',
        },
        {
          type: 'select',
          name: 'type',
          placeholder: helptext.dataset_acl_type_placeholder,
          tooltip: helptext.dataset_acl_type_tooltip,
          options: helptext.dataset_acl_type_options,
          class: 'inline-block'
        },
        {
          type: 'select',
          name: 'perms_type',
          placeholder: helptext.dataset_acl_perms_type_placeholder,
          tooltip: helptext.dataset_acl_perms_type_placeholder,
          options: helptext.dataset_acl_perms_type_options,
          class: 'inline-block'
        },
        {
          type: 'select',
          name: 'basic_perms',
          placeholder: helptext.dataset_acl_perms_placeholder,
          tooltip: helptext.dataset_acl_perms_tooltip,
          options: helptext.dataset_acl_basic_perms_options,
          class: 'inline-block'
        },
        {
          type: 'select',
          multiple: true,
          name: 'advanced_perms',
          placeholder: helptext.dataset_acl_perms_placeholder,
          tooltip: helptext.dataset_acl_perms_tooltip,
          options: helptext.dataset_acl_advanced_perms_options,
          class: 'inline-block'
        },
        {
          type: 'select',
          name: 'basic_flags',
          placeholder: helptext.dataset_acl_flags_placeholder,
          tooltip: helptext.dataset_acl_flags_tooltip,
          options: helptext.dataset_acl_basic_flags_options,
          class: 'inline-block'
        },
        {
          type: 'select',
          name: 'flags_type',
          placeholder: helptext.dataset_acl_flags_type_placeholder,
          tooltip: helptext.dataset_acl_flags_type_placeholder,
          options: helptext.dataset_acl_flags_type_options,
          class: 'inline-block'
        },
        {
          type: 'select',
          multiple: true,
          name: 'advanced_flags',
          placeholder: helptext.dataset_acl_flags_placeholder,
          tooltip: helptext.dataset_acl_flags_tooltip,
          options: helptext.dataset_acl_advanced_flags_options,
          class: 'inline-block'
        }
      ],
      listFields: []
    },
    {
      type: 'checkbox',
      name: 'recursive',
      placeholder: helptext.dataset_acl_recursive_placeholder,
      tooltip: helptext.dataset_acl_recursive_tooltip,
      value: false
    }
  ];

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected aroute: ActivatedRoute, protected rest: RestService,
              protected ws: WebSocketService, protected userService: UserService,
              protected storageService: StorageService, protected dialog: DialogService) {}

  preInit(entityEdit: any) {
    entityEdit.isNew = true; // remove me when we find a way to get the permissions
    this.sub = this.aroute.params.subscribe(params => {
      this.path_fc = '/mnt/' + params['path'];
      this.path_fc = _.find(this.fieldConfig, {name:'path'});
      this.path_fc.value = this.path;
    });

    this.userService.listAllUsers().subscribe(res => {
      const users = [];
      const items = res.data.items;
      for (let i = 0; i < items.length; i++) {
        users.push({label: items[i].label, value: items[i].id});
      }
      this.userOptions = users;
    });

    this.userService.listAllGroups().subscribe(res => {
      const groups = [];
      const items = res.data.items;
      for (let i = 0; i < items.length; i++) {
        groups.push({label: items[i].label, value: items[i].id});
      }
      this.groupOptions = groups;
    });
  }

  afterInit(entityEdit: any) {
    this.recursive = entityEdit.formGroup.controls['recursive'];
    this.recursive_subscription = this.recursive.valueChanges.subscribe((value) => {
      if (value === true) {
        this.dialog.confirm(helptext.dataset_acl_recursive_dialog_warning,
         helptext.dataset_acl_recursive_dialog_warning_message)
        .subscribe((res) => {
          if (!res) {
            this.recursive.setValue(false);
          }
        });
      }
    });
  }

  resourceTransformIncomingRestData(data) {
    console.log(data);
    return data;
  }

  ngOnDestroy() {
    this.recursive_subscription.unsubscribe();
  }

  beforeSubmit(data) {
  }

  updateGroupSearchOptions(value = "", parent) {
    parent.userService.listAllGroups(value).subscribe(res => {
      const groups = [];
      const items = res.data.items;
      for (let i = 0; i < items.length; i++) {
        groups.push({label: items[i].label, value: items[i].id});
      }
        parent.groupSearchOptions = groups;
    });
  }

  updateUserSearchOptions(value = "", parent) {
    parent.userService.listAllUsers(value).subscribe(res => {
      const users = [];
      const items = res.data.items;
      for (let i = 0; i < items.length; i++) {
        users.push({label: items[i].label, value: items[i].id});
      }
      parent.userSearchOptions = users;
    });
  }
}
