import {
  Component,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as _ from 'lodash';
import { AclItemTag, AclType } from 'app/enums/acl-type.enum';
import helptext from 'app/helptext/storage/volumes/datasets/dataset-acl';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { Option } from 'app/interfaces/option.interface';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/pages/common/entity/entity-dialog/entity-dialog.component';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import {
  FieldConfig,
} from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { RelationAction } from 'app/pages/common/entity/entity-form/models/relation-action.enum';
import { EntityFormService } from 'app/pages/common/entity/entity-form/services/entity-form.service';
import { EntityJobComponent } from 'app/pages/common/entity/entity-job/entity-job.component';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { WebSocketService, StorageService, DialogService } from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { UserService } from 'app/services/user.service';
import { T } from 'app/translate-marker';

@UntilDestroy()
@Component({
  selector: 'app-dataset-posix-acl',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class DatasetPosixAclComponent implements FormConfiguration {
  queryCall: 'filesystem.getacl' = 'filesystem.getacl';
  updateCall: 'filesystem.setacl' = 'filesystem.setacl';
  isEntity = true;
  pk: string;
  protected path: string;
  protected datasetId: string;
  private aclIsTrivial = false;
  protected userOptions: Option[];
  protected groupOptions: Option[];
  protected userSearchOptions: [];
  protected groupSearchOptions: [];
  protected defaults: any;
  protected recursive: any;
  private aces: any;
  private aces_fc: any;
  private entityForm: EntityFormComponent;
  formGroup: FormGroup;
  data: Object = {};
  error: string;
  protected dialogRef: any;
  route_success: string[] = ['storage'];
  save_button_enabled = true;

  protected uid_fc: any;
  protected gid_fc: any;

  fieldSetDisplay = 'default';
  fieldConfig: FieldConfig[] = [];
  fieldSets: FieldSet[] = [
    {
      name: helptext.dataset_acl_title_file,
      class: 'dataset-acl-editor',
      label: true,
      width: '50%',
      config: [
        {
          type: 'input',
          name: 'path',
          class: 'hello-mom',
          placeholder: helptext.dataset_acl_path_placeholder,
          readonly: true,
        },
        {
          type: 'combobox',
          name: 'uid',
          width: '100%',
          placeholder: helptext.dataset_acl_uid_placeholder,
          tooltip: helptext.dataset_acl_uid_tooltip,
          updateLocal: true,
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
          name: 'gid',
          placeholder: helptext.dataset_acl_gid_placeholder,
          tooltip: helptext.dataset_acl_gid_tooltip,
          updateLocal: true,
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
    },
    {
      name: helptext.dataset_acl_title_list,
      label: true,
      width: '50%',
      config: [
        {
          type: 'list',
          name: 'aces',
          width: '100%',
          deleteButtonOnFirst: true,
          addBtnMessage: helptext.dataset_acl_add_item_btn,
          placeholder: helptext.dataset_acl_aces_placeholder,
          templateListField: [
            {
              type: 'select',
              name: 'tag',
              placeholder: helptext.posix_tag.placeholder,
              tooltip: helptext.posix_tag.tooltip,
              options: helptext.posix_tag.options,
              required: true,
            },
            {
              type: 'combobox',
              name: 'user',
              placeholder: helptext.dataset_acl_user_placeholder,
              tooltip: helptext.dataset_acl_user_tooltip,
              updateLocal: true,
              options: [],
              searchOptions: [],
              updater: this.updateUserSearchOptions,
              loadMoreOptions: this.loadMoreOptions,
              isHidden: true,
              required: true,
            },
            {
              type: 'combobox',
              name: 'group',
              placeholder: helptext.dataset_acl_group_placeholder,
              tooltip: helptext.dataset_acl_group_tooltip,
              updateLocal: true,
              options: [],
              searchOptions: [],
              updater: this.updateGroupSearchOptions,
              loadMoreOptions: this.loadMoreGroupOptions,
              isHidden: true,
              required: true,
            },
            {
              type: 'select',
              multiple: true,
              name: 'perms',
              placeholder: helptext.posix_perms.placeholder,
              tooltip: helptext.posix_perms.tooltip,
              options: helptext.posix_perms.options,
            },
            {
              type: 'checkbox',
              name: 'default',
              placeholder: helptext.posix_default.placeholder,
              tooltip: helptext.posix_default.tooltip,
              isHidden: false,
            },
          ],
          listFields: [],
        },
      ],
    },
    {
      name: 'divider',
      divider: true,
    },
    {
      name: helptext.dataset_acl_title_advanced,
      label: true,
      width: '100%',
      config: [
        {
          type: 'checkbox',
          name: 'recursive',
          placeholder: helptext.dataset_acl_recursive_placeholder,
          tooltip: helptext.dataset_acl_recursive_tooltip,
          value: false,
        },
        {
          type: 'checkbox',
          name: 'traverse',
          placeholder: helptext.dataset_acl_traverse_placeholder,
          tooltip: helptext.dataset_acl_traverse_tooltip,
          value: false,
          isHidden: true,
          disabled: true,
          relation: [{
            action: RelationAction.Hide,
            when: [{
              name: 'recursive',
              value: false,
            }],
          }],
        },
      ],
    },
    {
      name: 'divider',
      divider: true,
    },
  ];

  custActions: any[] = [
    {
      id: 'use_perm_editor',
      name: helptext.permissions_editor_button,
      function: () => {
        this.router.navigate(new Array('/').concat([
          'storage', 'permissions', this.datasetId,
        ]));
      },
    },
    {
      id: 'strip_acl',
      name: helptext.dataset_acl_stripacl_placeholder,
      function: () => {
        this.doStripACL();
      },
    },
  ];

  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected aroute: ActivatedRoute,
    protected ws: WebSocketService,
    protected userService: UserService,
    protected storageService: StorageService,
    protected dialogService: DialogService,
    protected loader: AppLoaderService,
    protected dialog: MatDialog,
    protected entityFormService: EntityFormService,
  ) {}

  isCustActionVisible(actionId: string): boolean {
    if (this.aclIsTrivial) {
      return actionId === 'use_perm_editor';
    }
    return actionId === 'strip_acl';
  }

  preInit(): void {
    this.aroute.params.pipe(untilDestroyed(this)).subscribe((params) => {
      this.datasetId = params['path'];
      this.path = '/mnt/' + params['path'];
      const path_fc = _.find(this.fieldSets[0].config, { name: 'path' });
      path_fc.value = this.path;
      this.route.queryParams.pipe(untilDestroyed(this)).subscribe((qparams) => {
        if (qparams && qparams.default) {
          this.pk = qparams.default;
        } else {
          this.pk = this.path;
        }
      });
    });

    this.userService.userQueryDSCache().pipe(untilDestroyed(this)).subscribe((users) => {
      const userOptions: Option[] = [];
      for (let i = 0; i < users.length; i++) {
        userOptions.push({ label: users[i].username, value: users[i].username });
      }
      this.userOptions = userOptions;

      this.uid_fc.options = this.userOptions;
    });

    this.userService.groupQueryDSCache().pipe(untilDestroyed(this)).subscribe((groups) => {
      const groupOptions: Option[] = [];
      for (let i = 0; i < groups.length; i++) {
        groupOptions.push({ label: groups[i].group, value: groups[i].group });
      }
      this.groupOptions = groupOptions;

      this.gid_fc.options = this.groupOptions;
    });
  }

  afterInit(entityEdit: EntityFormComponent): void {
    this.entityForm = entityEdit;
    this.recursive = entityEdit.formGroup.controls['recursive'];
    this.recursive.valueChanges.pipe(untilDestroyed(this)).subscribe((value: any) => {
      if (value === true) {
        this.dialogService.confirm(helptext.dataset_acl_recursive_dialog_warning,
          helptext.dataset_acl_recursive_dialog_warning_message)
          .pipe(untilDestroyed(this)).subscribe((res: boolean) => {
            if (!res) {
              this.recursive.setValue(false);
            }
          });
      }
    });
    this.ws.call('filesystem.acl_is_trivial', [this.path]).pipe(untilDestroyed(this)).subscribe((acl_is_trivial) => {
      this.aclIsTrivial = acl_is_trivial;
    }, (err) => {
      new EntityUtils().handleWSError(this.entityForm, err);
    });

    this.aces_fc = _.find(this.fieldConfig, { name: 'aces' });
    this.aces = this.entityForm.formGroup.controls['aces'];
    this.aces.valueChanges.pipe(untilDestroyed(this)).subscribe((res: any) => {
      let controls;
      let user_fc;
      let group_fc;
      const listFields = this.aces_fc.listFields;
      const canSave = true;
      if (listFields && listFields.length > 0 && res.length === listFields.length) {
        for (let i = 0; i < listFields.length; i++) {
          controls = listFields[i];
          if (controls) {
            user_fc = _.find(controls, { name: 'user' });
            group_fc = _.find(controls, { name: 'group' });
            if (user_fc.options === undefined || user_fc.options.length === 0) {
              user_fc.options = this.userOptions;
            }
            if (!user_fc['parent']) {
              user_fc.parent = this;
            }
            if (group_fc.options === undefined || group_fc.options.length === 0) {
              group_fc.options = this.groupOptions;
            }
            if (!group_fc['parent']) {
              group_fc.parent = this;
            }
            if (res[i].tag === AclItemTag.User) {
              this.setDisabled(user_fc, this.aces.controls[i].controls['user'], false, false);
              this.setDisabled(group_fc, this.aces.controls[i].controls['group'], true, true);
            } else if (res[i].tag === AclItemTag.Group) {
              this.setDisabled(user_fc, this.aces.controls[i].controls['user'], true, true);
              this.setDisabled(group_fc, this.aces.controls[i].controls['group'], false, false);
            } else {
              this.setDisabled(user_fc, this.aces.controls[i].controls['user'], true, true);
              this.setDisabled(group_fc, this.aces.controls[i].controls['group'], true, true);
            }
          }
        }
      }
      this.save_button_enabled = canSave;
    });
  }

  setDisabled(fieldConfig: FieldConfig, formControl: FormControl, disable: boolean, hide: boolean): void {
    fieldConfig.disabled = disable;
    fieldConfig['isHidden'] = hide;
    if (formControl && formControl.disabled !== disable) {
      const method = disable ? 'disable' : 'enable';
      formControl[method]();
    }
  }

  resourceTransformIncomingRestData(data: any): any {
    if (data.acl.length === 0) {
      setTimeout(() => {
        this.handleEmptyACL();
      }, 1000);
    }
    return { aces: [] as any };
  }

  handleEmptyACL(): void {
    this.loader.close();
    this.dialogService.errorReport(helptext.empty_acl_dialog.title, helptext.empty_acl_dialog.message)
      .pipe(untilDestroyed(this)).subscribe(() => {
        this.router.navigate(new Array('/').concat(this.route_success));
      });
  }

  async dataHandler(entityForm: EntityFormComponent, defaults?: any): Promise<void> {
    entityForm.formGroup.controls['aces'].reset();
    (entityForm.formGroup.controls['aces'] as FormGroup).controls = {};
    this.aces_fc.listFields = [];
    this.gid_fc = _.find(this.fieldConfig, { name: 'gid' });
    this.uid_fc = _.find(this.fieldConfig, { name: 'uid' });

    this.loader.open();
    const res = entityForm.queryResponse;
    if (defaults) {
      res.acl = defaults;
    }
    const user: any = await this.userService.getUserObject(res.uid);
    if (user && user.pw_name) {
      entityForm.formGroup.controls['uid'].setValue(user.pw_name);
    } else {
      entityForm.formGroup.controls['uid'].setValue(res.uid);
      this.uid_fc.warnings = helptext.user_not_found;
    }
    const group: any = await this.userService.getGroupObject(res.gid);
    if (group && group.gr_name) {
      entityForm.formGroup.controls['gid'].setValue(group.gr_name);
    } else {
      entityForm.formGroup.controls['gid'].setValue(res.gid);
      this.gid_fc.warnings = helptext.group_not_found;
    }
    let data = res.acl;
    let acl: any;
    if (!data.length) {
      data = [data];
    }

    for (let i = 0; i < data.length; i++) {
      acl = {};
      acl.tag = data[i].tag;
      acl.default = data[i].default;
      acl.perms = [];
      for (const item in data[i].perms) {
        if (data[i].perms[item]) {
          acl.perms.push(item);
        }
      }
      if (acl.tag === AclItemTag.User) {
        const usr: any = await this.userService.getUserObject(data[i].id);
        if (usr && usr.pw_name) {
          acl.user = usr.pw_name;
        } else {
          acl.user = data[i].id;
          acl['user_not_found'] = true;
        }
      } else if (acl.tag === AclItemTag.Group) {
        const grp: any = await this.userService.getGroupObject(data[i].id);
        if (grp && grp.gr_name) {
          acl.group = grp.gr_name;
        } else {
          acl.group = data[i].id;
          acl['group_not_found'] = true;
        }
      }
      const propName = 'aces';
      const aces_fg = entityForm.formGroup.controls[propName] as FormGroup;
      if (aces_fg.controls[i] === undefined) {
        // add controls;
        const templateListField = _.cloneDeep(_.find(this.fieldConfig, { name: propName }).templateListField);
        (aces_fg as any).push(this.entityFormService.createFormGroup(templateListField));
        this.aces_fc.listFields.push(templateListField);
      }

      for (const prop in acl) {
        if (acl.hasOwnProperty(prop)) {
          if (prop === 'user' && acl['user_not_found']) {
            delete (acl['user_not_found']);
            _.find(this.aces_fc.listFields[i], { name: prop })['warnings'] = helptext.user_not_found;
          }
          if (prop === 'group' && acl['group_not_found']) {
            delete (acl['group_not_found']);
            _.find(this.aces_fc.listFields[i], { name: prop })['warnings'] = helptext.group_not_found;
          }
          (aces_fg.controls[i] as FormGroup).controls[prop].setValue(acl[prop]);
        }
      }
    }
    this.loader.close();
  }

  beforeSubmit(data: any): void {
    const dacl = [];
    for (let i = 0; i < data.aces.length; i++) {
      const d: any = {};
      const acl = data.aces[i];
      d['tag'] = acl.tag;
      d['id'] = -1;
      d['default'] = acl.default ? acl.default : false;
      if (acl.tag === AclItemTag.User) {
        d['id'] = acl.user;
      } else if (acl.tag === AclItemTag.Group) {
        d['id'] = acl.group;
      }
      d['perms'] = {};
      const perm_options = helptext.posix_perms.options;
      for (let j = 0; j < perm_options.length; j++) {
        const perm = perm_options[j].value;
        if (_.indexOf(acl.perms, perm) > -1) {
          d['perms'][perm] = true;
        } else {
          d['perms'][perm] = false;
        }
      }
      dacl.push(d);
    }
    data['dacl'] = dacl;
  }

  async customSubmit(body: any): Promise<void> {
    body.uid = body.apply_user ? body.uid : null;
    body.gid = body.apply_group ? body.gid : null;

    const doesNotWantToEditDataset = this.storageService.isDatasetTopLevel(this.path.replace('mnt/', ''))
      && !(await this.dialogService
        .confirm(helptext.dataset_acl_dialog_warning, helptext.dataset_acl_toplevel_dialog_message)
        .toPromise());

    if (doesNotWantToEditDataset) {
      return;
    }

    this.dialogRef = this.dialog.open(EntityJobComponent, { data: { title: helptext.save_dialog.title } });
    this.dialogRef.componentInstance.setDescription(helptext.save_dialog.message);
    const dacl = body.dacl;

    await this.userService.getUserByName(body.uid).toPromise().then((userObj) => {
      if (userObj && userObj.hasOwnProperty('pw_uid')) {
        body.uid = userObj.pw_uid;
      }
    }, (err) => {
      console.error(err);
    });

    await this.userService.getGroupByName(body.gid).toPromise().then((groupObj) => {
      if (groupObj && groupObj.hasOwnProperty('gr_gid')) {
        body.gid = groupObj.gr_gid;
      }
    }, (err) => {
      console.error(err);
    });

    for (let i = 0; i < dacl.length; i++) {
      if (dacl[i].tag === AclItemTag.User) {
        await this.userService.getUserByName(dacl[i].id).toPromise().then((userObj) => {
          if (userObj && userObj.hasOwnProperty('pw_uid')) {
            dacl[i]['id'] = userObj.pw_uid;
          }
        }, (err) => {
          console.error(err);
        });
      } else if (dacl[i].tag === AclItemTag.Group) {
        await this.userService.getGroupByName(dacl[i].id).toPromise().then((groupObj) => {
          if (groupObj && groupObj.hasOwnProperty('gr_gid')) {
            dacl[i]['id'] = groupObj.gr_gid;
          }
        }, (err) => {
          console.error(err);
        });
      }
    }

    this.dialogRef.componentInstance.setCall(this.updateCall,
      [{
        path: this.path,
        dacl,
        uid: body.uid,
        gid: body.gid,
        acltype: AclType.Posix1e,
        options: {
          recursive: body.recursive,
          traverse: body.traverse,
        },
      }]);
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      this.entityForm.success = true;
      this.dialogRef.close();
      this.router.navigate(new Array('/').concat(
        this.route_success,
      ));
    });
    this.dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe(() => {
    });
  }

  updateGroupSearchOptions(value = '', parent: any, config: FieldConfig): void {
    (parent.userService as UserService).groupQueryDSCache(value).pipe(untilDestroyed(this)).subscribe((groups) => {
      const groupOptions: Option[] = [];
      for (let i = 0; i < groups.length; i++) {
        groupOptions.push({ label: groups[i].group, value: groups[i].group });
      }
      config.searchOptions = groupOptions;
    });
  }

  updateUserSearchOptions(value = '', parent: any, config: FieldConfig): void {
    (parent.userService as UserService).userQueryDSCache(value).pipe(untilDestroyed(this)).subscribe((items) => {
      const users: Option[] = [];
      for (let i = 0; i < items.length; i++) {
        users.push({ label: items[i].username, value: items[i].username });
      }
      config.searchOptions = users;
    });
  }

  doStripACL(): void {
    const conf: DialogFormConfiguration = {
      title: helptext.stripACL_dialog.title,
      message: helptext.stripACL_dialog.message,
      fieldConfig: [
        {
          type: 'checkbox',
          name: 'traverse',
          placeholder: helptext.stripACL_dialog.traverse_checkbox,
        },
      ],
      // warning:helptext.stripACL_dialog.warning,
      saveButtonText: helptext.dataset_acl_stripacl_placeholder,
      parent: this,
      customSubmit: (entityDialog: EntityDialogComponent) => {
        entityDialog.dialogRef.close();

        this.dialogRef = this.dialog.open(EntityJobComponent, { data: { title: T('Stripping ACLs') } });
        this.dialogRef.componentInstance.setDescription(T('Stripping ACLs...'));

        this.dialogRef.componentInstance.setCall(this.updateCall,
          [{
            path: this.path,
            dacl: [],
            options: {
              recursive: true,
              traverse: !!entityDialog.formValue.traverse,
              stripacl: true,
            },
          }]);
        this.dialogRef.componentInstance.submit();
        this.dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
          this.entityForm.success = true;
          this.dialogRef.close();
          this.router.navigate(new Array('/').concat(
            this.route_success,
          ));
        });
        this.dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((err: any) => {
          new EntityUtils().handleWSError(this.entityForm, err);
        });
      },
    };
    this.dialogService.dialogFormWide(conf);
  }

  loadMoreOptions(length: number, parent: any, searchText: string, config: FieldConfig): void {
    (parent.userService as UserService).userQueryDSCache(searchText, length).pipe(untilDestroyed(this)).subscribe((items) => {
      const users: Option[] = [];
      for (let i = 0; i < items.length; i++) {
        users.push({ label: items[i].username, value: items[i].username });
      }
      if (searchText == '') {
        config.options = config.options.concat(users);
      } else {
        config.searchOptions = config.searchOptions.concat(users);
      }
    });
  }

  loadMoreGroupOptions(length: number, parent: any, searchText: string, config: FieldConfig): void {
    (parent.userService as UserService).groupQueryDSCache(searchText, false, length).pipe(untilDestroyed(this)).subscribe((groups) => {
      const groupOptions: Option[] = [];
      for (let i = 0; i < groups.length; i++) {
        groupOptions.push({ label: groups[i].group, value: groups[i].group });
      }
      if (searchText == '') {
        config.options = config.options.concat(groupOptions);
      } else {
        config.searchOptions = config.searchOptions.concat(groupOptions);
      }
    });
  }
}
