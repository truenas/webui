import { Component, OnDestroy } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import helptext from '../../../../../helptext/storage/volumes/datasets/dataset-permissions';
import { DialogService, RestService, StorageService, WebSocketService } from '../../../../../services/';
import { UserService } from '../../../../../services/user.service';
import { T } from '../../../../../translate-marker';
import { FieldConfig } from '../../../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector : 'app-dataset-permissions',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class DatasetPermissionsComponent implements OnDestroy {

  protected path: string;
  protected mp_path: any;
  protected mp_user: any;
  protected mp_group: any;
  protected mp_mode: any;
  protected mp_mode_en: any;
  protected mp_recursive: any;
  protected mp_recursive_subscription: any;
  public sub: Subscription;
  public formGroup: FormGroup;
  public data: Object = {};
  public error: string;
  public busy: Subscription;
  protected fs: any = (<any>window).filesize;
  protected route_success: string[] = [ 'storage', 'pools' ];
  protected resource_name = 'storage/permission';

  public fieldConfig: FieldConfig[] = [];
  public fieldSets: FieldSet[] = [
    {
      name: helptext.heading_dataset_path,
      label: true,
      config: [
        {
          type: 'input',
          name : 'mp_path',
          placeholder : helptext.dataset_permissions_mp_path_placeholder,
          readonly: true
        }
      ],
      width: '100%'
    },
    {
      name:'divider',
      divider:true
    },
    {
      name: helptext.heading_who,
      label: true,
      config: [
        /* Default hidden value to make the legacy endpoint happy */
        {
          type: 'input',
          name: 'mp_acl',
          isHidden: true,
          value: 'unix'
        },
        {
          type: 'checkbox',
          name: 'mp_user_en',
          placeholder: helptext.dataset_permissions_mp_user_en_placeholder,
          tooltip: helptext.dataset_permissions_mp_user_en_tooltip,
          value: true
        },
        {
          type: 'combobox',
          name: 'mp_user',
          placeholder: helptext.dataset_permissions_mp_user_placeholder,
          tooltip: helptext.dataset_permissions_mp_user_tooltip,
          options: [],
          searchOptions: [],
          parent: this,
          updater: this.updateUserSearchOptions,
        },
        {
          type: 'checkbox',
          name: 'mp_group_en',
          placeholder: helptext.dataset_permissions_mp_group_en_placeholder,
          tooltip: helptext.dataset_permissions_mp_group_en_tooltip,
          value: true
        },
        {
          type: 'combobox',
          name: 'mp_group',
          placeholder: helptext.dataset_permissions_mp_group_placeholder,
          tooltip: helptext.dataset_permissions_mp_group_tooltip,
          options: [],
          searchOptions: [],
          parent: this,
          updater: this.updateGroupSearchOptions,
        }
      ],
      width: '50%'
    },
    {
      name: helptext.heading_access,
      label: true,
      config: [
        {
          type: 'checkbox',
          name: 'mp_mode_en',
          placeholder: helptext.dataset_permissions_mp_mode_en_placeholder,
          tooltip: helptext.dataset_permissions_mp_mode_en_tooltip,
          value: true
        },
        {
          type: 'permissions',
          name: 'mp_mode',
          placeholder: helptext.dataset_permissions_mp_mode_placeholder,
          tooltip: helptext.dataset_permissions_mp_mode_tooltip,
          isHidden: false
        }
      ],
      width: '50%'
    },
    {
      name:'divider',
      divider:true
    },
    {
      name: helptext.heading_advanced,
      label: true,
      config: [
        {
          type: 'checkbox',
          name: 'mp_recursive',
          placeholder: helptext.dataset_permissions_mp_recursive_placeholder,
          tooltip: helptext.dataset_permissions_mp_recursive_tooltip,
          value: false
        }
      ],
      width: '100%'
    },
    {
      name:'divider',
      divider:true
    }
  ];

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected aroute: ActivatedRoute, protected rest: RestService,
              protected ws: WebSocketService, protected userService: UserService,
              protected storageService: StorageService, protected dialog: DialogService) {}

  preInit(entityEdit: any) {
    entityEdit.isNew = true; // remove me when we find a way to get the permissions
    this.sub = this.aroute.params.subscribe(params => {
      this.path = '/mnt/' + params['path'];
      this.mp_path = _.find(this.fieldSets.find(set => set.name === helptext.heading_dataset_path).config, {name:'mp_path'});
      this.mp_path.value = this.path;
    });

    this.userService.userQueryDSCache().subscribe(items => {
      const users = [];
      for (let i = 0; i < items.length; i++) {
        users.push({label: items[i].username, value: items[i].username});
      }
      this.mp_user = _.find(this.fieldSets.find(set => set.name === helptext.heading_who).config, {'name' : 'mp_user'});
      this.mp_user.options = users;
    });

    this.userService.groupQueryDSCache().subscribe(items => {
      const groups = [];
      for (let i = 0; i < items.length; i++) {
        groups.push({label: items[i].group, value: items[i].group});
      }
      this.mp_group = _.find(this.fieldSets.find(set => set.name === helptext.heading_who).config, {'name' : 'mp_group'});
        this.mp_group.options = groups;
    });
    this.mp_mode = _.find(this.fieldSets.find(set => set.name === helptext.heading_access).config, {'name' : "mp_mode"});
    this.mp_mode_en = _.find(this.fieldSets.find(set => set.name === helptext.heading_access).config, {'name': 'mp_mode_en'});
  }

  afterInit(entityEdit: any) {
    this.storageService.filesystemStat(this.path).subscribe(res => {
      entityEdit.formGroup.controls['mp_mode'].setValue(res.mode.toString(8).substring(2,5));
      entityEdit.formGroup.controls['mp_user'].setValue(res.user);
      entityEdit.formGroup.controls['mp_group'].setValue(res.group);
    });
    this.mp_recursive = entityEdit.formGroup.controls['mp_recursive'];
    this.mp_recursive_subscription = this.mp_recursive.valueChanges.subscribe((value) => {
      if (value === true) {
        this.dialog.confirm(T("Warning"), T("Setting permissions recursively will affect this directory and any others below it. This might make data inaccessible."))
        .subscribe((res) => {
          if (!res) {
            this.mp_recursive.setValue(false);
          }
        });
      }
    });
  }

  ngOnDestroy() {
    this.mp_recursive_subscription.unsubscribe();
  }

  updateGroupSearchOptions(value = "", parent) {
    parent.userService.groupQueryDSCache(value).subscribe(items => {
      const groups = [];
      for (let i = 0; i < items.length; i++) {
        groups.push({label: items[i].group, value: items[i].group});
      }
        parent.mp_group.searchOptions = groups;
    });
  }

  updateUserSearchOptions(value = "", parent) {
    parent.userService.userQueryDSCache(value).subscribe(items => {
      const users = [];
      for (let i = 0; i < items.length; i++) {
        users.push({label: items[i].username, value: items[i].username});
      }
      parent.mp_user.searchOptions = users;
    });
  }
}
