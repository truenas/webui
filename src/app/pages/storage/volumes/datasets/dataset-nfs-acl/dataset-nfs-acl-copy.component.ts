import {
  Component,
} from '@angular/core';
import {
  FormArray,
  FormGroup,
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { DefaultAclType } from 'app/enums/acl-type.enum';
import { PosixAclTag } from 'app/enums/posix-acl.enum';
import helptext from 'app/helptext/storage/volumes/datasets/dataset-acl';
import { NfsAclItem } from 'app/interfaces/acl.interface';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { Option } from 'app/interfaces/option.interface';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/pages/common/entity/entity-dialog/entity-dialog.component';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import {
  FieldConfig,
} from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { RelationAction } from 'app/pages/common/entity/entity-form/models/relation-action.enum';
import { EntityFormService } from 'app/pages/common/entity/entity-form/services/entity-form.service';
import { WebSocketService, StorageService, DialogService } from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { UserService } from 'app/services/user.service';

@UntilDestroy()
@Component({
  selector: 'app-dataset-acl',
  template: '<entity-form [conf]="this"></entity-form>',
  providers: [EntityFormService],
})
export class DatasetNfsAclComponent implements FormConfiguration {
  queryCall: 'filesystem.getacl' = 'filesystem.getacl';
  updateCall: 'filesystem.setacl' = 'filesystem.setacl';
  isEntity = true;
  pk: string;
  protected path: string;
  protected datasetId: string;
  private aclIsTrivial = false;
  protected userOptions: any[];
  protected groupOptions: any[];
  protected userSearchOptions: [];
  protected groupSearchOptions: [];
  protected defaults: Option[] = [];
  protected recursive: any;
  private aces: any;
  private aces_fc: FieldConfig;
  private entityForm: EntityFormComponent;
  formGroup: FormGroup;
  data: Record<string, unknown> = {};
  error: string;
  route_success: string[] = ['storage'];
  save_button_enabled = true;
  private homeShare: boolean;
  private isTrivialMessageSent = false;

  protected uid_fc: FieldConfig;
  protected gid_fc: FieldConfig;

  fieldSetDisplay = 'default'; // default | carousel | stepper
  fieldConfig: FieldConfig[] = [];

  custActions = [
    {
      id: 'show_defaults',
      name: helptext.preset_cust_action_btn,
      function: () => {
        this.showChoiceDialog(true);
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
    private translate: TranslateService,
    private entityFormService: EntityFormService,
  ) {}

  preInit(): void {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('homeShare')) {
      this.homeShare = true;
    }

    this.ws.call('filesystem.default_acl_choices').pipe(untilDestroyed(this)).subscribe((res: any[]) => {
      res.forEach((item) => {
        if (item !== 'POSIX_OPEN' && item !== 'POSIX_RESTRICTED') {
          this.defaults.push({ label: item, value: item });
        }
      });
    });
  }

  chooseDefaultSetting(value: string): void {
    const num = value === 'RESTRICTED' ? 2 : 3;
    while (this.aces.controls.length > num) {
      this.aces.removeAt(num);
    }
    this.ws.call('filesystem.get_default_acl', [value as DefaultAclType]).pipe(untilDestroyed(this)).subscribe((res) => {
      this.dataHandler(this.entityForm, res);
    });
  }

  // TODO: Refactor for better readability
  resourceTransformIncomingRestData(data: any): any {
    let returnLater = false;
    if (data.acl.length === 0) {
      setTimeout(() => {
        this.handleEmptyACL();
      }, 1000);
      return { aces: [] as any };
    }
    if (this.homeShare) {
      returnLater = true;
      this.ws.call('filesystem.get_default_acl', [DefaultAclType.Home]).pipe(untilDestroyed(this)).subscribe((res) => {
        data.acl = res;
        return { aces: data.acl as any };
      });
    }
    if (!returnLater) {
      return { aces: data.acl as any };
    }
  }

  handleEmptyACL(): void {
    this.loader.close();
    this.dialogService.errorReport(helptext.empty_acl_dialog.title, helptext.empty_acl_dialog.message)
      .pipe(untilDestroyed(this)).subscribe(() => {
        this.router.navigate(new Array('/').concat(this.route_success));
      });
  }

  async dataHandler(entityForm: EntityFormComponent, defaults?: NfsAclItem[]): Promise<void> {
    entityForm.formGroup.controls['aces'].reset();
    (entityForm.formGroup.controls['aces'] as FormArray).controls = [];
    this.aces_fc.listFields = [];

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
      acl.type = data[i].type;
      acl.tag = data[i].tag;
      if (acl.tag === PosixAclTag.User) {
        const usr: any = await this.userService.getUserObject(data[i].id);
        if (usr && usr.pw_name) {
          acl.user = usr.pw_name;
        } else {
          acl.user = data[i].id;
          acl['user_not_found'] = true;
        }
      } else if (acl.tag === PosixAclTag.Group) {
        const grp: any = await this.userService.getGroupObject(data[i].id);
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
      const aces_fg = entityForm.formGroup.get(propName) as FormArray;
      if (!aces_fg.controls[i]) {
        // add controls;
        const templateListField = _.cloneDeep(_.find(this.fieldConfig, { name: propName }).templateListField);
        const formGroup = this.entityFormService.createFormGroup(templateListField);
        aces_fg.push(formGroup);
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
          (aces_fg.controls[i] as FormGroup).controls[prop].setValue(acl[prop]);
        }
      }
    }
    this.loader.close();
    this.dialogService.closeAllDialogs();
    if (this.aclIsTrivial && !this.isTrivialMessageSent && !this.homeShare) {
      this.showChoiceDialog();
    }
  }

  showChoiceDialog(presetsOnly = false): void {
    const msg1 = this.translate.instant(helptext.type_dialog.radio_preset_tooltip);
    const msg2 = this.translate.instant(helptext.preset_dialog.message);
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
              action: RelationAction.Show,
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
      customSubmit: (entityDialog: EntityDialogComponent) => {
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
}
