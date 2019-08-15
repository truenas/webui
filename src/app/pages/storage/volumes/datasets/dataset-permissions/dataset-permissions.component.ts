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

  protected editCall = 'pool.dataset.permission';
  protected datasetPath: string;
  protected id: any;
  protected user: any;
  protected group: any;
  protected mode: any;
  protected recursive: any;
  protected recursive_subscription: any;
  public sub: Subscription;
  public formGroup: FormGroup;
  public data: Object = {};
  public error: string;
  public busy: Subscription;
  protected fs: any = (<any>window).filesize;
  protected route_success: string[] = [ 'storage', 'pools' ];
  protected isEntity = true;

  public fieldConfig: FieldConfig[] = [];
  public fieldSets: FieldSet[] = [
    {
      name: helptext.heading_dataset_path,
      label: true,
      config: [
        {
          type: 'input',
          name : 'id',
          placeholder : helptext.dataset_permissions_id_placeholder,
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
        {
          type: 'combobox',
          name: 'user',
          placeholder: helptext.dataset_permissions_user_placeholder,
          tooltip: helptext.dataset_permissions_user_tooltip,
          options: [],
          searchOptions: [],
          parent: this,
          updater: this.updateUserSearchOptions,
        },
        {
          type: 'combobox',
          name: 'group',
          placeholder: helptext.dataset_permissions_group_placeholder,
          tooltip: helptext.dataset_permissions_group_tooltip,
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
          type: 'permissions',
          name: 'mode',
          placeholder: helptext.dataset_permissions_mode_placeholder,
          tooltip: helptext.dataset_permissions_mode_tooltip,
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
          name: 'recursive',
          placeholder: helptext.dataset_permissions_recursive_placeholder,
          tooltip: helptext.dataset_permissions_recursive_tooltip,
          value: false
        },
        {
          type: 'checkbox',
          name: 'traverse',
          placeholder: helptext.dataset_permissions_traverse_placeholder,
          tooltip: helptext.dataset_permissions_traverse_tooltip,
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

  protected datasetMode: any;

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected aroute: ActivatedRoute, protected rest: RestService,
              protected ws: WebSocketService, protected userService: UserService,
              protected storageService: StorageService, protected dialog: DialogService) {}

  preInit(entityEdit: any) {
    entityEdit.isNew = true; // remove me when we find a way to get the permissions
    this.sub = this.aroute.params.subscribe(params => {
      this.datasetPath = '/mnt/' + params['pk'];
      this.id = _.find(this.fieldSets.find(set => set.name === helptext.heading_dataset_path).config, {name:'id'});
      this.id.value = this.datasetPath;
    });

    this.userService.userQueryDSCache().subscribe(items => {
      const users = [];
      for (let i = 0; i < items.length; i++) {
        users.push({label: items[i].username, value: items[i].username});
      }
      this.user = _.find(this.fieldSets.find(set => set.name === helptext.heading_who).config, {'name' : 'user'});
      this.user.options = users;
    });

    this.userService.groupQueryDSCache().subscribe(items => {
      const groups = [];
      for (let i = 0; i < items.length; i++) {
        groups.push({label: items[i].group, value: items[i].group});
      }
      this.group = _.find(this.fieldSets.find(set => set.name === helptext.heading_who).config, {'name' : 'group'});
        this.group.options = groups;
    });
    this.mode = _.find(this.fieldSets.find(set => set.name === helptext.heading_access).config, {'name' : "mode"});
  }

  afterInit(entityEdit: any) {
    this.storageService.filesystemStat(this.datasetPath).subscribe(res => {
      this.datasetMode = res.mode.toString(8).substring(2,5);
      entityEdit.formGroup.controls['mode'].setValue(this.datasetMode);
      entityEdit.formGroup.controls['user'].setValue(res.user);
      entityEdit.formGroup.controls['group'].setValue(res.group);
    });
    this.recursive = entityEdit.formGroup.controls['recursive'];
    this.recursive_subscription = this.recursive.valueChanges.subscribe((value) => {
      if (value === true) {
        this.dialog.confirm(T("Warning"), T("Setting permissions recursively will affect this directory and any others below it. This might make data inaccessible."))
        .subscribe((res) => {
          if (!res) {
            this.recursive.setValue(false);
          }
        });
      }
    });
  }

  ngOnDestroy() {
    this.recursive_subscription.unsubscribe();
  }

  updateGroupSearchOptions(value = "", parent) {
    parent.userService.groupQueryDSCache(value).subscribe(items => {
      const groups = [];
      for (let i = 0; i < items.length; i++) {
        groups.push({label: items[i].group, value: items[i].group});
      }
        parent.group.searchOptions = groups;
    });
  }

  updateUserSearchOptions(value = "", parent) {
    parent.userService.userQueryDSCache(value).subscribe(items => {
      const users = [];
      for (let i = 0; i < items.length; i++) {
        users.push({label: items[i].username, value: items[i].username});
      }
      parent.user.searchOptions = users;
    });
  }

  beforeSubmit(data) {
    data['acl'] = [];

    data['options'] = {
      'stripacl': true,
      'recursive': data['recursive'],
      'traverse': data['traverse'],
    };
    delete data['recursive'];
    delete data['traverse'];

    if (data['mode'] === this.datasetMode) {
      delete data['mode'];
      data['options']['stripacl'] = false;
    }
  }
}
