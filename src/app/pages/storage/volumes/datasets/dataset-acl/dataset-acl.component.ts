import {
  Component,
  OnDestroy,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  FormGroup,
} from '@angular/forms';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';

import { UserService } from '../../../../../services/user.service';
import { WebSocketService, StorageService, DialogService } from '../../../../../services';
import {
  FieldConfig,
} from '../../../../common/entity/entity-form/models/field-config.interface';
import { AppLoaderService } from '../../../../../services/app-loader/app-loader.service';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { T } from '../../../../../translate-marker';
import helptext from '../../../../../helptext/storage/volumes/datasets/dataset-acl';
import { MatDialog } from '@angular/material/dialog';
import { EntityJobComponent } from '../../../../common/entity/entity-job/entity-job.component';
import { EntityUtils } from '../../../../common/entity/utils';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';

import { AccessControlList } from 'app/interfaces/access-control-list.interface';

@Component({
  selector: 'app-dataset-acl',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class DatasetAclComponent implements OnDestroy {
  protected queryCall = 'filesystem.getacl';
  protected updateCall = 'filesystem.setacl';
  protected isEntity = true;
  protected pk: string;
  protected path: string;
  protected datasetId: string;
  private aclIsTrivial = false;
  protected userOptions: any[];
  protected groupOptions: any[];
  protected userSearchOptions: [];
  protected groupSearchOptions: [];
  protected defaults = [];
  protected recursive: any;
  protected recursive_subscription: any;
  private aces: any;
  private aces_fc: any;
  private aces_subscription: any;
  private entityForm: any;
  sub: Subscription;
  formGroup: FormGroup;
  data: Object = {};
  error: string;
  busy: Subscription;
  protected fs: any = (<any>window).filesize;
  protected dialogRef: any;
  protected route_success: string[] = ['storage', 'pools'];
  save_button_enabled = true;
  private homeShare: boolean;
  private isTrivialMessageSent = false;
  private aclData: AccessControlList;
  private emptyAclWarningShown = false;

  protected uid_fc: any;
  protected gid_fc: any;

  fieldSetDisplay = 'default';// default | carousel | stepper
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
          label: helptext.dataset_acl_uid_label,
          placeholder: helptext.dataset_acl_uid_placeholder,
          tooltip: helptext.dataset_acl_uid_tooltip,
          updateLocal: true,
          options: [],
          searchOptions: [],
          parent: this,
          updater: this.updateUserSearchOptions,
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
          label: helptext.dataset_acl_gid_label,
          placeholder: helptext.dataset_acl_gid_placeholder,
          tooltip: helptext.dataset_acl_gid_tooltip,
          updateLocal: true,
          options: [],
          searchOptions: [],
          parent: this,
          updater: this.updateGroupSearchOptions,
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
              placeholder: helptext.dataset_acl_tag_placeholder,
              options: helptext.dataset_acl_tag_options,
              tooltip: helptext.dataset_acl_tag_tooltip,
              required: true,
            },
            {
              type: 'combobox',
              name: 'user',
              label: helptext.dataset_acl_user_label,
              placeholder: helptext.dataset_acl_user_placeholder,
              tooltip: helptext.dataset_acl_user_tooltip,
              updateLocal: true,
              options: [],
              searchOptions: [],
              updater: this.updateUserSearchOptions,
              isHidden: true,
              required: true,
            },
            {
              type: 'combobox',
              name: 'group',
              label: helptext.dataset_acl_group_label,
              placeholder: helptext.dataset_acl_group_placeholder,
              tooltip: helptext.dataset_acl_group_tooltip,
              updateLocal: true,
              options: [],
              searchOptions: [],
              updater: this.updateGroupSearchOptions,
              isHidden: true,
              required: true,
            },
            {
              type: 'select',
              name: 'type',
              placeholder: helptext.dataset_acl_type_placeholder,
              tooltip: helptext.dataset_acl_type_tooltip,
              options: helptext.dataset_acl_type_options,
              required: true,
              value: 'ALLOW',
            },
            {
              type: 'select',
              name: 'perms_type',
              required: true,
              placeholder: helptext.dataset_acl_perms_type_placeholder,
              tooltip: helptext.dataset_acl_perms_type_tooltip,
              options: helptext.dataset_acl_perms_type_options,
              value: 'BASIC',
            },
            {
              type: 'select',
              name: 'basic_perms',
              required: true,
              placeholder: helptext.dataset_acl_perms_placeholder,
              tooltip: helptext.dataset_acl_perms_tooltip,
              options: helptext.dataset_acl_basic_perms_options,
              value: 'MODIFY',
            },
            {
              type: 'select',
              multiple: true,
              isHidden: true,
              required: true,
              name: 'advanced_perms',
              placeholder: helptext.dataset_acl_perms_placeholder,
              tooltip: helptext.dataset_acl_perms_tooltip,
              options: helptext.dataset_acl_advanced_perms_options,
            },
            {
              type: 'select',
              name: 'flags_type',
              required: true,
              placeholder: helptext.dataset_acl_flags_type_placeholder,
              tooltip: helptext.dataset_acl_flags_type_tooltip,
              options: helptext.dataset_acl_flags_type_options,
              value: 'BASIC',
            },
            {
              type: 'select',
              name: 'basic_flags',
              placeholder: helptext.dataset_acl_flags_placeholder,
              tooltip: helptext.dataset_acl_flags_tooltip,
              options: helptext.dataset_acl_basic_flags_options,
              value: 'INHERIT',
            },
            {
              type: 'select',
              multiple: true,
              isHidden: true,
              required: true,
              name: 'advanced_flags',
              placeholder: helptext.dataset_acl_flags_placeholder,
              tooltip: helptext.dataset_acl_flags_tooltip,
              options: helptext.dataset_acl_advanced_flags_options,
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
            action: 'HIDE',
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
          'storage', 'pools', 'permissions', this.datasetId,
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
    {
      id: 'show_defaults',
      name: helptext.preset_cust_action_btn,
      function: () => {
        this.showChoiceDialog(true);
      },
    },
  ];

  constructor(protected router: Router, protected route: ActivatedRoute,
    protected aroute: ActivatedRoute,
    protected ws: WebSocketService, protected userService: UserService,
    protected storageService: StorageService, protected dialogService: DialogService,
    protected loader: AppLoaderService, protected dialog: MatDialog,
    private translate: TranslateService) {}

  isCustActionVisible(actionId: string) {
    if (actionId === 'show_defaults') {
      return true;
    }
    if (this.aclIsTrivial) {
      return actionId === 'use_perm_editor';
    }
    return actionId === 'strip_acl';
  }

  preInit(entityEdit: any) {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('homeShare')) {
      this.homeShare = true;
    }
    this.sub = this.aroute.params.subscribe((params) => {
      this.datasetId = params['path'];
      this.path = '/mnt/' + params['path'];
      const path_fc = _.find(this.fieldSets[0].config, { name: 'path' });
      path_fc.value = this.path;
      this.route.queryParams.subscribe((qparams) => {
        if (qparams && qparams.default) {
          this.pk = qparams.default;
        } else {
          this.pk = this.path;
        }
      });
    });

    this.userService.userQueryDSCache().subscribe((items) => {
      const users = [];
      for (let i = 0; i < items.length; i++) {
        users.push({ label: items[i].username, value: items[i].username });
      }
      this.userOptions = users;

      this.uid_fc.options = this.userOptions;
    });

    this.userService.groupQueryDSCache().subscribe((items) => {
      const groups = [];
      for (let i = 0; i < items.length; i++) {
        groups.push({ label: items[i].group, value: items[i].group });
      }
      this.groupOptions = groups;

      this.gid_fc.options = this.groupOptions;
    });
    this.ws.call('filesystem.default_acl_choices').subscribe((res) => {
      res.forEach((item) => {
        this.defaults.push({ label: item, value: item });
      });
    });
  }

  afterInit(entityEdit: any) {
    this.entityForm = entityEdit;
    this.recursive = entityEdit.formGroup.controls['recursive'];
    this.recursive_subscription = this.recursive.valueChanges.subscribe((value) => {
      if (value === true) {
        this.dialogService.confirm(helptext.dataset_acl_recursive_dialog_warning,
          helptext.dataset_acl_recursive_dialog_warning_message)
          .subscribe((res) => {
            if (!res) {
              this.recursive.setValue(false);
            }
          });
      }
    });

    this.ws.call('filesystem.acl_is_trivial', [this.path]).subscribe((acl_is_trivial) => {
      this.aclIsTrivial = acl_is_trivial;
    }, (err) => {
      new EntityUtils().handleWSError(this.entityForm, err);
    });

    this.aces_fc = _.find(this.fieldConfig, { name: 'aces' });
    this.aces = this.entityForm.formGroup.controls['aces'];
    this.aces_subscription = this.aces.valueChanges.subscribe((res) => {
      let controls;
      let user_fc;
      let group_fc;
      let adv_perms_fc;
      let basic_perms_fc;
      let adv_flags_fc;
      let basic_flags_fc;
      const listFields = this.aces_fc.listFields;
      let canSave = true;
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
            if (res[i].tag === 'USER') {
              this.setDisabled(user_fc, this.aces.controls[i].controls['user'], false, false);
              this.setDisabled(group_fc, this.aces.controls[i].controls['group'], true, true);
            } else if (res[i].tag === 'GROUP') {
              this.setDisabled(user_fc, this.aces.controls[i].controls['user'], true, true);
              this.setDisabled(group_fc, this.aces.controls[i].controls['group'], false, false);
            } else {
              this.setDisabled(user_fc, this.aces.controls[i].controls['user'], true, true);
              this.setDisabled(group_fc, this.aces.controls[i].controls['group'], true, true);
            }
            adv_perms_fc = _.find(controls, { name: 'advanced_perms' });
            basic_perms_fc = _.find(controls, { name: 'basic_perms' });
            if (res[i].perms_type === 'ADVANCED') {
              adv_perms_fc.isHidden = false;
              adv_perms_fc.required = true;
              basic_perms_fc.isHidden = true;
              basic_perms_fc.required = false;
            } else {
              adv_perms_fc.isHidden = true;
              adv_perms_fc.required = false;
              basic_perms_fc.isHidden = false;
              basic_perms_fc.required = true;
              if (res[i].basic_perms === 'OTHER') {
                basic_perms_fc.warnings = helptext.dataset_acl_basic_perms_other_warning;
                canSave = false;
              } else {
                basic_perms_fc.warnings = null;
              }
            }
            adv_flags_fc = _.find(controls, { name: 'advanced_flags' });
            basic_flags_fc = _.find(controls, { name: 'basic_flags' });
            if (res[i].flags_type === 'ADVANCED') {
              adv_flags_fc.isHidden = false;
              adv_flags_fc.required = true;
              basic_flags_fc.isHidden = true;
              basic_flags_fc.required = false;
            } else {
              adv_flags_fc.isHidden = true;
              adv_flags_fc.required = false;
              basic_flags_fc.isHidden = false;
              basic_flags_fc.required = true;
            }
          }
        }
      }
      this.save_button_enabled = canSave;
    });
  }

  chooseDefaultSetting(value: string) {
    let num;
    value === 'RESTRICTED' ? num = 2 : num = 3;
    while (this.aces.controls.length > num) {
      this.aces.removeAt(num);
    }
    this.ws.call('filesystem.get_default_acl', [value]).subscribe((res) => {
      this.dataHandler(this.entityForm, res);
    });
  }

  setDisabled(fieldConfig, formControl, disable, hide) {
    fieldConfig.disabled = disable;
    fieldConfig['isHidden'] = hide;
    if (formControl && formControl.disabled !== disable) {
      const method = disable ? 'disable' : 'enable';
      formControl[method]();
    }
  }

  resourceTransformIncomingRestData(data: AccessControlList) {
    this.aclData = { ...data };
    if (data.acl.length > 0) {
      if (this.homeShare) {
        this.ws.call('filesystem.get_default_acl', ['HOME']).subscribe((res) => {
          data.acl = res;
        });
      }
    }

    return data;
  }

  async dataHandler(entityForm, defaults?) {
    entityForm.formGroup.controls['aces'].reset();
    entityForm.formGroup.controls['aces'].controls = [];
    this.aces_fc.listFields = [];
    this.gid_fc = _.find(this.fieldConfig, { name: 'gid' });
    this.uid_fc = _.find(this.fieldConfig, { name: 'uid' });

    this.loader.open();
    const res = entityForm.queryResponse;
    if (defaults) {
      res.acl = defaults;
    }
    // Don't check for user and group if this call comes from the Presets dialog
    if (!defaults) {
      const user = await this.userService.getUserObject(res.uid);
      if (user && user.pw_name) {
        entityForm.formGroup.controls['uid'].setValue(user.pw_name);
      } else {
        entityForm.formGroup.controls['uid'].setValue(res.uid);
        this.uid_fc.warnings = helptext.user_not_found;
      }
      const group = await this.userService.getGroupObject(res.gid);
      if (group && group.gr_name) {
        entityForm.formGroup.controls['gid'].setValue(group.gr_name);
      } else {
        entityForm.formGroup.controls['gid'].setValue(res.gid);
        this.gid_fc.warnings = helptext.group_not_found;
      }
    }
    let data = res.acl;
    let acl;
    if (!data.length) {
      data = [data];
    }

    for (let i = 0; i < data.length; i++) {
      acl = {};
      acl.type = data[i].type;
      acl.tag = data[i].tag;
      if (acl.tag === 'USER') {
        const usr = await this.userService.getUserObject(data[i].id);
        if (usr && usr.pw_name) {
          acl.user = usr.pw_name;
        } else {
          acl.user = data[i].id;
          acl['user_not_found'] = true;
        }
      } else if (acl.tag === 'GROUP') {
        const grp = await this.userService.getGroupObject(data[i].id);
        if (grp && grp.gr_name) {
          acl.group = grp.gr_name;
        } else {
          acl.group = data[i].id;
          acl['group_not_found'] = true;
        }
      }
      if (data[i].flags['BASIC']) {
        acl.flags_type = 'BASIC';
        acl.basic_flags = data[i].flags['BASIC'];
      } else {
        acl.flags_type = 'ADVANCED';
        const flags = data[i].flags;
        acl.advanced_flags = [];
        for (const flag in flags) {
          if (flags.hasOwnProperty(flag) && flags[flag]) {
            acl.advanced_flags.push(flag);
          }
        }
      }
      if (data[i].perms['BASIC']) {
        acl.perms_type = 'BASIC';
        acl.basic_perms = data[i].perms['BASIC'];
      } else {
        acl.perms_type = 'ADVANCED';
        const perms = data[i].perms;
        acl.advanced_perms = [];
        for (const perm in perms) {
          if (perms.hasOwnProperty(perm) && perms[perm]) {
            acl.advanced_perms.push(perm);
          }
        }
      }
      const propName = 'aces';
      const aces_fg = entityForm.formGroup.controls[propName];
      if (aces_fg.controls[i] === undefined) {
        // add controls;
        const templateListField = _.cloneDeep(_.find(this.fieldConfig, { name: propName }).templateListField);
        aces_fg.push(entityForm.entityFormService.createFormGroup(templateListField));
        this.aces_fc.listFields.push(templateListField);
      }

      for (const prop in acl) {
        if (acl.hasOwnProperty(prop)) {
          if (prop === 'basic_perms' && acl[prop] === 'OTHER') {
            _.find(
              _.find(
                this.aces_fc.listFields[i], { name: prop },
              )['options'], { value: 'OTHER' },
            )['hiddenFromDisplay'] = false;
          }
          if (prop === 'user' && acl['user_not_found']) {
            delete (acl['user_not_found']);
            _.find(this.aces_fc.listFields[i], { name: prop })['warnings'] = helptext.user_not_found;
          }
          if (prop === 'group' && acl['group_not_found']) {
            delete (acl['group_not_found']);
            _.find(this.aces_fc.listFields[i], { name: prop })['warnings'] = helptext.group_not_found;
          }
          aces_fg.controls[i].controls[prop].setValue(acl[prop]);
        }
      }
    }
    this.loader.close();

    if (this.aclIsTrivial && !this.isTrivialMessageSent && !this.homeShare) {
      this.showChoiceDialog();
    }
    if (this.aclData.acl.length === 0 && !this.emptyAclWarningShown) {
      const conf: DialogFormConfiguration = {
        title: T('No Inheritable ACL Entries'),
        fieldConfig: [],
        warning: T('No inheritable ACL entries available. At least one inheritable ACL entry must be added.'),
        saveButtonText: T('OK'),
        hideCancel: true,
        customSubmit: (entityDialog) => {
          entityDialog.dialogRef.close();
          this.emptyAclWarningShown = true;
        },
      };
      this.dialogService.dialogForm(conf);
    }
  }

  showChoiceDialog(presetsOnly = false) {
    let msg1; let
      msg2;
    this.translate.get(helptext.type_dialog.radio_preset_tooltip).subscribe((m1) => {
      this.translate.get(helptext.preset_dialog.message).subscribe((m2) => {
        msg1 = m1;
        msg2 = m2;
      });
    });
    const conf: DialogFormConfiguration = {
      title: presetsOnly ? helptext.type_dialog.radio_preset : helptext.type_dialog.title,
      message: presetsOnly ? `${msg1} ${msg2}` : null,
      fieldConfig: [
        {
          type: 'radio',
          name: 'useDefault',
          options: [
            {
              label: helptext.type_dialog.radio_preset,
              name: 'defaultACL',
              tooltip: helptext.type_dialog.radio_preset_tooltip,
              value: true,
            },
            {
              label: helptext.type_dialog.radio_custom,
              name: 'customACL',
              value: false,
            },
          ],
          value: true,
          isHidden: presetsOnly,
        },
        {
          type: 'select',
          name: 'defaultOptions',
          placeholder: helptext.type_dialog.input.placeholder,
          options: this.defaults,
          relation: [
            {
              action: 'SHOW',
              when: [{
                name: 'useDefault',
                value: true,
              }],
            },
          ],
          required: true,
        },
      ],
      saveButtonText: helptext.type_dialog.button,
      parent: this,
      hideCancel: !presetsOnly,
      customSubmit: (entityDialog) => {
        entityDialog.dialogRef.close();
        const { useDefault, defaultOptions } = entityDialog.formValue;
        if (useDefault && defaultOptions) {
          this.chooseDefaultSetting(defaultOptions);
        }
        this.isTrivialMessageSent = true;
      },
    };
    this.dialogService.dialogForm(conf);
  }

  ngOnDestroy() {
    this.recursive_subscription.unsubscribe();
    this.aces_subscription.unsubscribe();
  }

  beforeSubmit(data: any) {
    const dacl = [];
    for (let i = 0; i < data.aces.length; i++) {
      const d = {};
      const acl = data.aces[i];
      d['tag'] = acl.tag;
      d['id'] = null;
      if (acl.tag === 'USER') {
        d['id'] = acl.user;
      } else if (acl.tag === 'GROUP') {
        d['id'] = acl.group;
      }
      d['type'] = acl.type;
      if (acl.perms_type === 'BASIC') {
        d['perms'] = { BASIC: acl.basic_perms };
      } else {
        d['perms'] = {};
        const adv_perm_options = helptext.dataset_acl_advanced_perms_options;
        for (let j = 0; j < adv_perm_options.length; j++) {
          const perm = adv_perm_options[j].value;
          if (_.indexOf(acl.advanced_perms, perm) > -1) {
            d['perms'][perm] = true;
          }
        }
      }
      if (acl.flags_type === 'BASIC') {
        d['flags'] = { BASIC: acl.basic_flags };
      } else {
        d['flags'] = {};
        const adv_flag_options = helptext.dataset_acl_advanced_flags_options;
        for (let j = 0; j < adv_flag_options.length; j++) {
          const flag = adv_flag_options[j].value;
          if (_.indexOf(acl.advanced_flags, flag) > -1) {
            d['flags'][flag] = true;
          }
        }
      }
      dacl.push(d);
    }
    data['dacl'] = dacl;
  }

  async customSubmit(body: any) {
    body.uid = body.apply_user ? body.uid : null;
    body.gid = body.apply_group ? body.gid : null;
    const doesNotWantToEditDataset = this.storageService.isDatasetTopLevel(body.path.replace('mnt/', ''))
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
      if (dacl[i].tag === 'USER') {
        await this.userService.getUserByName(dacl[i].id).toPromise().then((userObj) => {
          if (userObj && userObj.hasOwnProperty('pw_uid')) {
            dacl[i]['id'] = userObj.pw_uid;
          }
        }, (err) => {
          console.error(err);
        });
      } else if (dacl[i].tag === 'GROUP') {
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
        path: body.path,
        dacl,
        uid: body.uid,
        gid: body.gid,
        options: {
          recursive: body.recursive,
          traverse: body.traverse,
        },
      }]);
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.subscribe((res) => {
      this.entityForm.success = true;
      this.dialogRef.close();
      const navigationExtras: NavigationExtras = { state: { highlightDataset: this.datasetId } };
      this.router.navigate(new Array('/').concat(
        this.route_success,
      ), navigationExtras);
    });
    this.dialogRef.componentInstance.failure.subscribe((res) => {
    });
  }

  updateGroupSearchOptions(value = '', parent, config) {
    parent.userService.groupQueryDSCache(value).subscribe((items) => {
      const groups = [];
      for (let i = 0; i < items.length; i++) {
        groups.push({ label: items[i].group, value: items[i].group });
      }
      config.searchOptions = groups;
    });
  }

  updateUserSearchOptions(value = '', parent, config) {
    parent.userService.userQueryDSCache(value).subscribe((items) => {
      const users = [];
      for (let i = 0; i < items.length; i++) {
        users.push({ label: items[i].username, value: items[i].username });
      }
      config.searchOptions = users;
    });
  }

  doStripACL() {
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
      customSubmit: (entityDialog) => {
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
        this.dialogRef.componentInstance.success.subscribe((res) => {
          this.entityForm.success = true;
          this.dialogRef.close();
          const navigationExtras: NavigationExtras = { state: { highlightDataset: this.datasetId } };
          this.router.navigate(new Array('/').concat(
            this.route_success,
          ), navigationExtras);
        });
        this.dialogRef.componentInstance.failure.subscribe((err) => {
          new EntityUtils().handleWSError(this.entityForm, err);
        });
      },
    };
    this.dialogService.dialogFormWide(conf);
  }

  goBack() {
    const navigationExtras: NavigationExtras = { state: { highlightDataset: this.datasetId } };
    this.router.navigate(new Array('/').concat(this.route_success), navigationExtras);
  }
}
