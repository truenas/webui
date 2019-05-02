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
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
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
  protected recursive: any;
  protected recursive_subscription: any;
  private aces: any;
  private aces_fc: any;
  private aces_subscription: any;
  private entityForm: any;
  private acl: any;
  public sub: Subscription;
  public formGroup: FormGroup;
  public data: Object = {};
  public error: string;
  public busy: Subscription;
  protected fs: any = (<any>window).filesize;
  protected route_success: string[] = [ 'storage', 'pools' ];

  public fieldSetDisplay  = 'default';//default | carousel | stepper
  public fieldConfig: FieldConfig[] = [];
  public fieldSets: FieldSet[] = [{
    name: helptext.dataset_acl_title_name,
    class: "dataset-acl-editor",
    label: true,
    config:[
    {
      type: 'input',
      name : 'path',
      placeholder : helptext.dataset_acl_path_placeholder,
      readonly: true
    },
    {
      type: 'list',
      name: 'aces',
      width: '100%',
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
          updateLocal: true,
          options: [],
          searchOptions: [],
          parent: this,
          updater: this.updateUserSearchOptions,
          isHidden: true,
          class: 'inline-block',
        },
        {
          type: 'combobox',
          name: 'group',
          placeholder: helptext.dataset_acl_group_placeholder,
          tooltip: helptext.dataset_acl_group_tooltip,
          updateLocal: true,
          options: [],
          searchOptions: [],
          parent: this,
          updater: this.updateGroupSearchOptions,
          isHidden: true,
        },
        {
          type: 'select',
          name: 'type',
          placeholder: helptext.dataset_acl_type_placeholder,
          tooltip: helptext.dataset_acl_type_tooltip,
          options: helptext.dataset_acl_type_options,
        },
        {
          type: 'select',
          name: 'perms_type',
          placeholder: helptext.dataset_acl_perms_type_placeholder,
          tooltip: helptext.dataset_acl_perms_type_placeholder,
          options: helptext.dataset_acl_perms_type_options,
        },
        {
          type: 'select',
          name: 'basic_perms',
          placeholder: helptext.dataset_acl_perms_placeholder,
          tooltip: helptext.dataset_acl_perms_tooltip,
          options: helptext.dataset_acl_basic_perms_options,
        },
        {
          type: 'select',
          multiple: true,
          isHidden: true,
          name: 'advanced_perms',
          placeholder: helptext.dataset_acl_perms_placeholder,
          tooltip: helptext.dataset_acl_perms_tooltip,
          options: helptext.dataset_acl_advanced_perms_options,
        },
        {
          type: 'select',
          name: 'flags_type',
          placeholder: helptext.dataset_acl_flags_type_placeholder,
          tooltip: helptext.dataset_acl_flags_type_placeholder,
          options: helptext.dataset_acl_flags_type_options,
        },
        {
          type: 'select',
          name: 'basic_flags',
          placeholder: helptext.dataset_acl_flags_placeholder,
          tooltip: helptext.dataset_acl_flags_tooltip,
          options: helptext.dataset_acl_basic_flags_options,
        },
        {
          type: 'select',
          multiple: true,
          isHidden: true,
          name: 'advanced_flags',
          placeholder: helptext.dataset_acl_flags_placeholder,
          tooltip: helptext.dataset_acl_flags_tooltip,
          options: helptext.dataset_acl_advanced_flags_options,
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
  ]}
  ];

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected aroute: ActivatedRoute, protected rest: RestService,
              protected ws: WebSocketService, protected userService: UserService,
              protected storageService: StorageService, protected dialog: DialogService) {}

  preInit(entityEdit: any) {
    entityEdit.isNew = true; // remove me when we find a way to get the permissions
    this.sub = this.aroute.params.subscribe(params => {
      this.path = '/mnt/' + params['path'];
      const path_fc = _.find(this.fieldSets[0].config, {name:'path'});
      path_fc.value = this.path;
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
    this.entityForm = entityEdit;
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
    this.aces_fc = _.find(this.fieldConfig, {"name": "aces"});
    this.aces = this.entityForm.formGroup.controls['aces'];
    this.aces_subscription = this.aces.valueChanges.subscribe(res => {
      let controls;
      let user_fc;
      let group_fc;
      let adv_perms_fc;
      let basic_perms_fc;
      let adv_flags_fc;
      let basic_flags_fc;
      const listFields = this.aces_fc.listFields;
      if (listFields && listFields.length > 0 && res.length === listFields.length) {
        for (let i = 0; i < listFields.length; i++) {
          controls = listFields[i];
          user_fc = _.find(controls, {"name": "user"});
          if (user_fc.options.length === 0) {
            user_fc.options = this.userOptions;
          }
          group_fc = _.find(controls, {"name": "group"});
          if (group_fc.options.length === 0) {
            group_fc.options = this.groupOptions;
          }
          if (res[i].tag === 'USER') {
            user_fc.isHidden = false;
            group_fc.isHidden = true;
          } else if (res[i].tag === 'GROUP') {
            user_fc.isHidden = true;
            group_fc.isHidden = false;
          } else {
            user_fc.isHidden = true;
            group_fc.isHidden = true;
          }
          adv_perms_fc = _.find(controls, {"name": "advanced_perms"});
          basic_perms_fc = _.find(controls, {"name": "basic_perms"});
          if (res[i].perms_type === "ADVANCED") {
            adv_perms_fc.isHidden = false;
            basic_perms_fc.isHidden = true;
          } else {
            adv_perms_fc.isHidden = true;
            basic_perms_fc.isHidden = false;
          }
          adv_flags_fc = _.find(controls, {"name": "advanced_flags"});
          basic_flags_fc = _.find(controls, {"name": "basic_flags"});
          if (res[i].perms_type === "ADVANCED") {
            adv_flags_fc.isHidden = false;
            basic_flags_fc.isHidden = true;
          } else {
            adv_flags_fc.isHidden = true;
            basic_flags_fc.isHidden = false;
          }
        }
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

  updateGroupSearchOptions(value = "", parent, config) {
    parent.userService.listAllGroups(value).subscribe(res => {
      const groups = [];
      const items = res.data.items;
      for (let i = 0; i < items.length; i++) {
        groups.push({label: items[i].label, value: items[i].id});
      }
        config.searchOptions = groups;
    });
  }

  updateUserSearchOptions(value = "", parent, config) {
    parent.userService.listAllUsers(value).subscribe(res => {
      const users = [];
      const items = res.data.items;
      for (let i = 0; i < items.length; i++) {
        users.push({label: items[i].label, value: items[i].id});
      }
      config.searchOptions = users;
    });
  }
}
