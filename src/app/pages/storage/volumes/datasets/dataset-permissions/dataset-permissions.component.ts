import { Component, OnDestroy } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { AclType } from 'app/enums/acl-type.enum';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { Option } from 'app/interfaces/option.interface';

import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import * as _ from 'lodash';
import helptext from '../../../../../helptext/storage/volumes/datasets/dataset-permissions';
import {
  DialogService, StorageService, UserService, WebSocketService,
} from '../../../../../services';
import { T } from '../../../../../translate-marker';
import { EntityJobComponent } from '../../../../common/entity/entity-job/entity-job.component';

@Component({
  selector: 'app-dataset-permissions',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class DatasetPermissionsComponent implements FormConfiguration, OnDestroy {
  protected updateCall = 'pool.dataset.permission';
  protected datasetPath: string;
  protected datasetId: string;
  protected recursive: any;
  protected recursive_subscription: any;
  formGroup: FormGroup;
  error: string;
  route_success: string[] = ['storage'];
  isEntity = true;
  protected dialogRef: any;
  private entityForm: any;
  protected userField: any;
  protected groupField: any;

  fieldSets: FieldSet[] = [
    {
      name: helptext.heading_dataset_path,
      label: true,
      config: [
        {
          type: 'input',
          name: 'id',
          placeholder: helptext.dataset_permissions_id_placeholder,
          readonly: true,
        },
      ],
      width: '100%',
    },
    {
      name: 'divider',
      divider: true,
    },
    {
      name: helptext.heading_owner,
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
          loadMoreOptions: this.loadMoreOptions,
        },
        {
          type: 'checkbox',
          name: 'apply_user',
          placeholder: helptext.apply_user.placeholder,
          tooltip: helptext.apply_user.tooltip,
          value: false,
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
          loadMoreOptions: this.loadMoreGroupOptions,
        },
        {
          type: 'checkbox',
          name: 'apply_group',
          placeholder: helptext.apply_group.placeholder,
          tooltip: helptext.apply_group.tooltip,
          value: false,
        },
      ],
      width: '50%',
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
          isHidden: false,
        },
      ],
      width: '50%',
    },
    {
      name: 'divider',
      divider: true,
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
          value: false,
        },
        {
          type: 'checkbox',
          name: 'traverse',
          placeholder: helptext.dataset_permissions_traverse_placeholder,
          tooltip: helptext.dataset_permissions_traverse_tooltip,
          value: false,
        },
      ],
      width: '100%',
    },
    {
      name: 'divider',
      divider: true,
    },
  ];

  custActions: any[] = [
    {
      id: 'use_acl',
      name: helptext.acl_manager_button,
      function: () => {
        this.ws.call('filesystem.getacl', [this.datasetPath]).subscribe((acl) => {
          if (acl.acltype === AclType.Posix1e) {
            this.router.navigate(new Array('/').concat([
              'storage', 'id', this.datasetId.split('/')[0], 'dataset',
              'posix-acl', this.datasetId,
            ]));
          } else {
            this.router.navigate(new Array('/').concat([
              'storage', 'id', this.datasetId.split('/')[0], 'dataset',
              'acl', this.datasetId,
            ]));
          }
        });
      },
    },
  ];

  protected datasetMode: string;

  constructor(
    protected aroute: ActivatedRoute,
    protected ws: WebSocketService,
    protected userService: UserService,
    protected storageService: StorageService,
    protected mdDialog: MatDialog,
    protected dialog: DialogService,
    protected router: Router,
  ) { }

  preInit(entityEdit: any): void {
    entityEdit.isNew = true; // remove me when we find a way to get the permissions
    this.aroute.params.subscribe((params) => {
      this.datasetId = params['pk'];
      this.datasetPath = '/mnt/' + this.datasetId;
      const idField = _.find(this.fieldSets.find((set) => set.name === helptext.heading_dataset_path).config, { name: 'id' });
      idField.value = this.datasetPath;
    });

    this.userService.userQueryDSCache().subscribe((items) => {
      const users: Option[] = [];
      for (let i = 0; i < items.length; i++) {
        users.push({ label: items[i].username, value: items[i].username });
      }
      this.userField = _.find(this.fieldSets.find((set) => set.name === helptext.heading_owner).config, { name: 'user' });
      this.userField.options = users;
    });

    this.userService.groupQueryDSCache().subscribe((groups) => {
      const groupOptions: Option[] = [];
      for (let i = 0; i < groups.length; i++) {
        groupOptions.push({ label: groups[i].group, value: groups[i].group });
      }
      this.groupField = _.find(this.fieldSets.find((set) => set.name === helptext.heading_owner).config, { name: 'group' });
      this.groupField.options = groupOptions;
    });
  }

  afterInit(entityEdit: any): void {
    this.entityForm = entityEdit;
    this.storageService.filesystemStat(this.datasetPath).subscribe((stat) => {
      this.datasetMode = stat.mode.toString(8).substring(2, 5);
      entityEdit.formGroup.controls['mode'].setValue(this.datasetMode);
      entityEdit.formGroup.controls['user'].setValue(stat.user);
      entityEdit.formGroup.controls['group'].setValue(stat.group);
    });
    this.recursive = entityEdit.formGroup.controls['recursive'];
    this.recursive_subscription = this.recursive.valueChanges.subscribe((value: any) => {
      if (value === true) {
        this.dialog.confirm(T('Warning'), T('Setting permissions recursively will affect this directory and any others below it. This might make data inaccessible.'))
          .subscribe((res: boolean) => {
            if (!res) {
              this.recursive.setValue(false);
            }
          });
      }
    });
  }

  ngOnDestroy(): void {
    this.recursive_subscription.unsubscribe();
  }

  updateGroupSearchOptions(value = '', parent: any): void {
    (parent.userService as UserService).groupQueryDSCache(value).subscribe((groups) => {
      const groupOptions: Option[] = [];
      for (let i = 0; i < groups.length; i++) {
        groupOptions.push({ label: groups[i].group, value: groups[i].group });
      }
      parent.groupField.searchOptions = groupOptions;
    });
  }

  updateUserSearchOptions(value = '', parent: any): void {
    (parent.userService as UserService).userQueryDSCache(value).subscribe((items) => {
      const users = [];
      for (let i = 0; i < items.length; i++) {
        users.push({ label: items[i].username, value: items[i].username });
      }
      parent.userField.searchOptions = users;
    });
  }

  beforeSubmit(data: any): void {
    if (!data.apply_user) {
      delete data.user;
    }
    if (!data.apply_group) {
      delete data.group;
    }
    delete data.apply_user;
    delete data.apply_group;

    data['acl'] = [];

    data['options'] = {
      stripacl: true,
      recursive: data['recursive'],
      traverse: data['traverse'],
    };
    delete data['recursive'];
    delete data['traverse'];

    if (data['mode'] === this.datasetMode) {
      delete data['mode'];
      data['options']['stripacl'] = false;
    }
  }

  customSubmit(data: any): void {
    this.dialogRef = this.mdDialog.open(EntityJobComponent, { data: { title: T('Saving Permissions') } });
    this.dialogRef.componentInstance.setDescription(T('Saving Permissions...'));
    this.dialogRef.componentInstance.setCall(this.updateCall, [this.datasetId, data]);
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.subscribe(() => {
      this.entityForm.success = true;
      this.dialogRef.close();
      this.router.navigate(new Array('/').concat(
        this.route_success,
      ));
    });
    this.dialogRef.componentInstance.failure.subscribe((err: any) => {
      console.error(err);
    });
  }

  loadMoreOptions(length: number, parent: any, searchText: string): void {
    (parent.userService as UserService).userQueryDSCache(searchText, length).subscribe((items) => {
      const users = [];
      for (let i = 0; i < items.length; i++) {
        users.push({ label: items[i].username, value: items[i].username });
      }
      if (searchText == '') {
        parent.userField.options = parent.userField.options.concat(users);
      } else {
        parent.userField.searchOptions = parent.userField.searchOptions.concat(users);
      }
    });
  }

  loadMoreGroupOptions(length: number, parent: any, searchText: string): void {
    (parent.userService as UserService).groupQueryDSCache(searchText, false, length).subscribe((groups) => {
      const groupOptions: Option[] = [];
      for (let i = 0; i < groups.length; i++) {
        groupOptions.push({ label: groups[i].group, value: groups[i].group });
      }
      if (searchText == '') {
        parent.groupField.options = parent.groupField.options.concat(groupOptions);
      } else {
        parent.groupField.searchOptions = parent.groupField.searchOptions.concat(groupOptions);
      }
    });
  }
}
