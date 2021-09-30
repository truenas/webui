import { Component } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as _ from 'lodash';
import { filter } from 'rxjs/operators';
import { AclType } from 'app/enums/acl-type.enum';
import helptext from 'app/helptext/storage/volumes/datasets/dataset-permissions';
import { DatasetPermissionsUpdate } from 'app/interfaces/dataset-permissions.interface';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form/entity-form.component';
import { FormComboboxConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { EntityJobComponent } from 'app/pages/common/entity/entity-job/entity-job.component';
import {
  DialogService, StorageService, UserService, WebSocketService,
} from 'app/services';
import { T } from 'app/translate-marker';

@UntilDestroy()
@Component({
  selector: 'app-dataset-permissions',
  templateUrl: './dataset-trivial-permissions.component.html',
  styleUrls: ['./dataset-trivial-permissions.component.scss'],
})
export class DatasetTrivialPermissionsComponent implements FormConfiguration {
  protected updateCall: 'pool.dataset.permission' = 'pool.dataset.permission';

  datasetPath: string;
  aclType: AclType;

  protected datasetId: string;
  formGroup: FormGroup;
  route_success: string[] = ['storage'];
  isEntity = true;
  private entityForm: EntityFormComponent;
  protected userField: FormComboboxConfig;
  protected groupField: FormComboboxConfig;

  fieldSets: FieldSet[] = [
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

  custActions = [
    {
      id: 'cancel',
      name: helptext.acl_manager_button,
      function: () => {
        if (this.aclType === AclType.Posix1e) {
          this.router.navigate([
            '/', 'storage', 'id', this.datasetId.split('/')[0], 'dataset',
            'posix-acl', this.datasetId,
          ]);
        } else {
          this.router.navigate([
            '/', 'storage', 'id', this.datasetId.split('/')[0], 'dataset',
            'acl', this.datasetId,
          ]);
        }
      },
    },
  ];

  isCustActionVisible(action: string): boolean {
    if (action !== 'cancel') {
      return true;
    }

    return this.aclType !== AclType.Off;
  }

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

  preInit(entityEdit: EntityFormComponent): void {
    entityEdit.isNew = true;
    this.aroute.params.pipe(untilDestroyed(this)).subscribe((params) => {
      this.datasetId = params['pk'];
      this.datasetPath = '/mnt/' + this.datasetId;
    });

    this.ws.call('pool.dataset.query', [[['id', '=', this.datasetId]]]).pipe(untilDestroyed(this)).subscribe((dataset) => {
      this.aclType = dataset[0].acltype.value as AclType;
    });

    this.userService.userQueryDSCache().pipe(untilDestroyed(this)).subscribe((users) => {
      this.userField = _.find(
        this.fieldSets.find((set) => set.name === helptext.heading_owner).config,
        { name: 'user' },
      ) as FormComboboxConfig;
      this.userField.options = users.map((user) => {
        return { label: user.username, value: user.username };
      });
    });

    this.userService.groupQueryDSCache().pipe(untilDestroyed(this)).subscribe((groups) => {
      this.groupField = _.find(
        this.fieldSets.find((set) => set.name === helptext.heading_owner).config,
        { name: 'group' },
      ) as FormComboboxConfig;
      this.groupField.options = groups.map((group) => {
        return { label: group.group, value: group.group };
      });
    });
  }

  afterInit(entityEdit: EntityFormComponent): void {
    this.entityForm = entityEdit;
    this.storageService.filesystemStat(this.datasetPath).pipe(untilDestroyed(this)).subscribe((stat) => {
      this.datasetMode = stat.mode.toString(8).substring(2, 5);
      entityEdit.formGroup.controls['mode'].setValue(this.datasetMode);
      entityEdit.formGroup.controls['user'].setValue(stat.user);
      entityEdit.formGroup.controls['group'].setValue(stat.group);
    });

    const recursive = entityEdit.formGroup.controls['recursive'];
    recursive.valueChanges.pipe(untilDestroyed(this)).subscribe((value: boolean) => {
      if (value) {
        this.dialog.confirm({
          title: T('Warning'),
          message: T('Setting permissions recursively will affect this directory and any others below it. This might make data inaccessible.'),
        }).pipe(
          filter((confirmed) => !confirmed),
          untilDestroyed(this),
        ).subscribe(() => {
          recursive.setValue(false);
        });
      }
    });
  }

  updateGroupSearchOptions(value = '', parent: this): void {
    parent.userService.groupQueryDSCache(value).pipe(untilDestroyed(parent)).subscribe((groups) => {
      parent.groupField.searchOptions = groups.map((group) => {
        return { label: group.group, value: group.group };
      });
    });
  }

  updateUserSearchOptions(value = '', parent: this): void {
    parent.userService.userQueryDSCache(value).pipe(untilDestroyed(parent)).subscribe((items) => {
      parent.userField.searchOptions = items.map((user) => {
        return { label: user.username, value: user.username };
      });
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

  customSubmit(data: DatasetPermissionsUpdate[1]): void {
    const dialogRef = this.mdDialog.open(EntityJobComponent, { data: { title: T('Saving Permissions') } });
    dialogRef.componentInstance.setDescription(T('Saving Permissions...'));
    dialogRef.componentInstance.setCall(this.updateCall, [this.datasetId, data]);
    dialogRef.componentInstance.submit();
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      this.entityForm.success = true;
      dialogRef.close();
      this.router.navigate(['/', ...this.route_success]);
    });
    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((err) => {
      console.error(err);
    });
  }

  loadMoreOptions(length: number, parent: this, searchText: string): void {
    parent.userService.userQueryDSCache(searchText, length)
      .pipe(untilDestroyed(parent))
      .subscribe((users) => {
        const userOptions = users.map((user) => {
          return { label: user.username, value: user.username };
        });
        if (searchText == '') {
          parent.userField.options = parent.userField.options.concat(userOptions);
        } else {
          parent.userField.searchOptions = parent.userField.searchOptions.concat(userOptions);
        }
      });
  }

  loadMoreGroupOptions(length: number, parent: this, searchText: string): void {
    parent.userService.groupQueryDSCache(searchText, false, length)
      .pipe(untilDestroyed(parent))
      .subscribe((groups) => {
        const groupOptions = groups.map((group) => {
          return { label: group.group, value: group.group };
        });
        if (searchText == '') {
          parent.groupField.options = parent.groupField.options.concat(groupOptions);
        } else {
          parent.groupField.searchOptions = parent.groupField.searchOptions.concat(groupOptions);
        }
      });
  }
}
