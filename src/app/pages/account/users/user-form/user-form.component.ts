import { Component } from '@angular/core';
import { AbstractControl, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import { ExplorerType } from 'app/enums/explorer-type.enum';
import helptext from 'app/helptext/account/user-form';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { Option } from 'app/interfaces/option.interface';
import { QueryFilter } from 'app/interfaces/query-api.interface';
import { User, UserUpdate } from 'app/interfaces/user.interface';
import { FieldSets } from 'app/pages/common/entity/entity-form/classes/field-sets';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form/entity-form.component';
import { FormSelectConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { RelationAction } from 'app/pages/common/entity/entity-form/models/relation-action.enum';
import { forbiddenValues } from 'app/pages/common/entity/entity-form/validators/forbidden-values-validation';
import {
  AppLoaderService, StorageService, UserService, WebSocketService, ValidationService,
} from 'app/services';
import { ModalService } from 'app/services/modal.service';

@UntilDestroy()
@Component({
  selector: 'app-user-form',
  template: '<entity-form [conf]="this"></entity-form>',
  providers: [UserService],
})
export class UserFormComponent implements FormConfiguration {
  queryCall = 'user.query' as const;
  addCall = 'user.create' as const;
  editCall = 'user.update' as const;
  pk: number;
  queryKey = 'id';
  isEntity = true;
  isNew: boolean;
  entityForm: EntityFormComponent;
  protected namesInUse: string[] = [];
  private homeSharePath: string;
  columnsOnForm = 2;
  title: string;

  fieldSetDisplay = 'default';// default | carousel | stepper
  fieldSets: FieldSets = new FieldSets([
    {
      name: helptext.user_form_title_name,
      class: helptext.user_form_title_class,
      label: true,
      width: '50%',
      config: [
        {
          type: 'input',
          name: helptext.user_form_full_name_name,
          placeholder: helptext.user_form_full_name_placeholder,
          tooltip: helptext.user_form_full_name_tooltip,
          required: true,
          validation: helptext.user_form_full_name_validation,
          blurStatus: true,
          blurEvent: () => this.fullNameBlur(),
          parent: this,
        },
        {
          type: 'input',
          name: helptext.user_form_username_name,
          placeholder: helptext.user_form_username_placeholder,
          tooltip: helptext.user_form_username_tooltip,
          required: true,
          validation: [
            Validators.required,
            Validators.pattern(UserService.VALIDATOR_NAME),
            Validators.maxLength(16),
            forbiddenValues(this.namesInUse),
          ],
          blurStatus: true,
          blurEvent: () => this.userNameBlur(),
          parent: this,
        },
        {
          type: 'input',
          inputType: 'email',
          name: helptext.user_form_email_name,
          placeholder: helptext.user_form_email_placeholder,
          tooltip: helptext.user_form_email_tooltip,
          validation: [Validators.email],
        },
      ],
    },
    {
      name: '',
      class: helptext.user_form_title_class,
      label: true,
      width: '50%',
      config: [
        {
          type: 'input',
          name: helptext.user_form_password_name,
          placeholder: helptext.user_form_password_placeholder,
          tooltip: helptext.user_form_password_tooltip,
          inputType: 'password',
          togglePw: true,
          required: true,
          validation: helptext.user_form_password_validation,
          isHidden: false,
        },
        {
          type: 'input',
          name: helptext.user_form_password_confirm_name,
          placeholder: helptext.user_form_password_confirm_placeholder,
          inputType: 'password',
          required: true,
          togglePw: true,
          validation: this.validationService.matchOtherValidator('password'),
          isHidden: false,
        },
        {
          type: 'input',
          name: helptext.user_form_password_edit_name,
          placeholder: helptext.user_form_password_edit_placeholder,
          tooltip: helptext.user_form_password_edit_tooltip,
          inputType: 'password',
          togglePw: true,
          validation: helptext.user_form_password_edit_validation,
          isHidden: true,
        },
        {
          type: 'input',
          name: helptext.user_form_password_edit_confirm_name,
          placeholder: helptext.user_form_password_edit_confirm_placeholder,
          inputType: 'password',
          togglePw: true,
          validation: this.validationService.matchOtherValidator('password_edit'),
          isHidden: true,
        },
      ],
    },
    {
      name: 'divider',
      divider: true,
    },
    {
      name: helptext.user_form_ids_groups_title,
      class: helptext.user_form_ids_groups_title_class,
      label: true,
      width: '50%',
      config: [
        {
          type: 'input',
          name: helptext.user_form_uid_name,
          placeholder: helptext.user_form_uid_placeholder,
          tooltip: helptext.user_form_uid_tooltip,
          required: true,
          validation: helptext.user_form_uid_validation,
        },
        {
          type: 'checkbox',
          name: helptext.user_form_group_create_name,
          placeholder: helptext.user_form_group_create_placeholder,
          tooltip: helptext.user_form_group_create_tooltip,
          value: true,
          isHidden: false,
          expandedHeight: true,
        },
      ],
    },
    {
      name: '',
      class: helptext.user_form_ids_groups_title_class,
      label: true,
      width: '50%',
      config: [
        {
          type: 'select',
          name: helptext.user_form_primary_group_name,
          placeholder: helptext.user_form_primary_group_placeholder,
          tooltip: helptext.user_form_primary_group_tooltip,
          options: [],
          relation: [
            {
              action: RelationAction.Disable,
              when: [{
                name: 'group_create',
                value: true,
              }],
            },
          ],
        },
        {
          type: 'select',
          name: helptext.user_form_aux_groups_name,
          placeholder: helptext.user_form_aux_groups_placeholder,
          tooltip: helptext.user_form_aux_groups_tooltip,
          options: [],
          multiple: true,
        },
      ],
    },
    {
      name: 'divider',
      divider: true,
    },
    {
      name: helptext.user_form_dirs_title_name,
      class: helptext.user_form_dirs_title_class,
      label: true,
      width: '50%',
      config: [
        {
          type: 'explorer',
          class: helptext.user_form_dirs_explorer_class,
          initial: '/mnt',
          explorerType: ExplorerType.Directory,
          name: helptext.user_form_dirs_explorer_name,
          placeholder: helptext.user_form_dirs_explorer_placeholder,
          value: helptext.user_form_dirs_explorer_value,
          tooltip: helptext.user_form_dirs_explorer_tooltip,
        },
        {
          type: 'permissions',
          name: helptext.user_form_home_dir_permissions_name,
          placeholder: helptext.user_form_home_dir_permissions_placeholder,
          tooltip: helptext.user_form_home_dir_permissions_tooltip,
        },
      ],
    },
    {
      name: helptext.user_form_auth_title_name,
      class: helptext.user_form_auth_title_class,
      label: true,
      width: '50%',
      config: [
        {
          type: 'textarea',
          name: helptext.user_form_auth_sshkey_name,
          placeholder: helptext.user_form_auth_sshkey_placeholder,
          tooltip: helptext.user_form_auth_sshkey_tooltip,
        },
        {
          type: 'select',
          name: helptext.user_form_auth_pw_enable_name,
          placeholder: helptext.user_form_auth_pw_enable_placeholder,
          tooltip: helptext.user_form_auth_pw_enable_tooltip,
          options: [
            { label: helptext.user_form_auth_pw_enable_label_yes, value: true },
            { label: helptext.user_form_auth_pw_enable_label_no, value: false },
          ],
          value: false,
        },
        {
          type: 'select',
          name: helptext.user_form_shell_name,
          placeholder: helptext.user_form_shell_placeholder,
          tooltip: helptext.user_form_shell_tooltip,
          options: [],
        },
        {
          type: 'checkbox',
          name: helptext.user_form_lockuser_name,
          placeholder: helptext.user_form_lockuser_placeholder,
          tooltip: helptext.user_form_lockuser_tooltip,
          isHidden: false,
        },
        {
          type: 'checkbox',
          name: helptext.user_form_sudo_name,
          placeholder: helptext.user_form_sudo_placeholder,
          tooltip: helptext.user_form_sudo_tooltip,
          isHidden: false,
        },
        {
          type: 'checkbox',
          name: helptext.user_form_microsoft_name,
          placeholder: helptext.user_form_microsoft_placeholder,
          tooltip: helptext.user_form_microsoft_tooltip,
        },
        {
          type: 'checkbox',
          name: helptext.user_form_smb_name,
          placeholder: helptext.user_form_smb_placeholder,
          tooltip: helptext.user_form_smb_tooltip,
          value: true,
        },
      ],
    },
    {
      name: 'divider',
      divider: true,
    },
  ] as FieldSet<this>[]);

  custActions = [
    {
      id: 'download_sshpubkey',
      name: helptext.user_form_download_key,
      function: () => {
        const name = this.entityForm.formGroup.controls['username'].value;
        const key = this.entityForm.formGroup.controls['sshpubkey'].value;
        const filename = name + '_public_key_rsa';
        const blob = new Blob([key], { type: 'text/plain' });
        this.storageService.downloadBlob(blob, filename);
      },
    },
  ];

  private shells: Option[];
  private shell: FormSelectConfig;
  private group: FormSelectConfig;
  private groups: FormSelectConfig;
  private password_disabled: AbstractControl;

  constructor(
    protected ws: WebSocketService,
    protected storageService: StorageService,
    public loader: AppLoaderService,
    private userService: UserService,
    protected validationService: ValidationService,
    private modalService: ModalService,
  ) {
    this.ws.call('user.query').pipe(untilDestroyed(this)).subscribe(
      (res) => {
        this.namesInUse.push(...res.map((user) => user.username));
      },
    );
  }

  afterInit(entityForm: EntityFormComponent): void {
    this.pk = entityForm.pk;
    this.loader.callStarted.emit();
    this.entityForm = entityForm;
    this.isNew = entityForm.isNew;
    this.password_disabled = entityForm.formGroup.controls['password_disabled'];
    if (!entityForm.isNew) {
      this.fieldSets
        .showConfig('password_edit')
        .showConfig('password_conf_edit');
      entityForm.setDisabled('password', true, true);
      entityForm.setDisabled('password_conf', true, true);
      this.password_disabled.valueChanges.pipe(untilDestroyed(this)).subscribe((password_disabled: boolean) => {
        if (!password_disabled) {
          entityForm.formGroup.controls['sudo'].setValue(false);
          entityForm.formGroup.controls['locked'].setValue(false);
        }
        this.fieldSets
          .toggleConfigVisibility('locked', password_disabled)
          .toggleConfigVisibility('sudo', password_disabled);
        entityForm.setDisabled('password_edit', password_disabled);
        entityForm.setDisabled('password_conf_edit', password_disabled);
      });
    } else {
      entityForm.setDisabled('password_edit', true, true);
      entityForm.setDisabled('password_conf_edit', true, true);
      this.fieldSets
        .showConfig('password')
        .showConfig('password_conf');
      this.password_disabled.valueChanges.pipe(untilDestroyed(this)).subscribe((password_disabled: boolean) => {
        if (!password_disabled) {
          entityForm.formGroup.controls['sudo'].setValue(false);
          entityForm.formGroup.controls['locked'].setValue(false);
        }
        this.fieldSets
          .toggleConfigVisibility('locked', password_disabled)
          .toggleConfigVisibility('sudo', password_disabled);
        entityForm.setDisabled('password', password_disabled);
        entityForm.setDisabled('password_conf', password_disabled);
      });

      this.ws.call('sharing.smb.query', [[['enabled', '=', true], ['home', '=', true]]])
        .pipe(untilDestroyed(this)).subscribe((shares) => {
          // On a new form, if there is a home SMB share, populate the 'home' form explorer with it...
          if (!shares.length) {
            return;
          }

          this.homeSharePath = shares[0].path;
          this.entityForm.formGroup.controls['home'].setValue(this.homeSharePath);
          // ...then add on /<username>
          this.entityForm.formGroup.controls['username'].valueChanges.pipe(untilDestroyed(this)).subscribe((value: string) => {
            this.entityForm.formGroup.controls['home'].setValue(`${this.homeSharePath}/${value}`);
          });
        });
      // If there is no home share, the 'home' path is populated from helptext
    }

    if (!entityForm.isNew) {
      this.fieldSets.hideConfig('group_create');
      entityForm.formGroup.controls['group_create'].setValue(false);
      this.title = helptext.title_edit;
    } else {
      this.title = helptext.title_add;
    }

    /* list groups */
    this.ws.call('group.query').pipe(untilDestroyed(this)).subscribe((groups) => {
      this.loader.callDone.emit();
      this.group = this.fieldSets.config('group') as FormSelectConfig;
      this.groups = this.fieldSets.config('groups') as FormSelectConfig;
      groups.forEach((group) => {
        this.group.options.push({ label: group.group, value: group.id });
        this.groups.options.push({ label: group.group, value: group.id });
      });
    });

    /* list users */
    const filter: QueryFilter<User> = ['id', '=', this.pk];
    this.ws.call('user.query', [[filter]]).pipe(untilDestroyed(this)).subscribe((res) => {
      if (res.length !== 0 && res[0].home !== '/nonexistent') {
        this.storageService.filesystemStat(res[0].home).pipe(untilDestroyed(this)).subscribe((stat) => {
          entityForm.formGroup.controls['home_mode'].setValue(stat.mode.toString(8).substring(2, 5));
        });
      } else {
        entityForm.formGroup.controls['home_mode'].setValue('755');
      }

      if (!entityForm.isNew) {
        entityForm.setDisabled('uid', true);
        entityForm.formGroup.controls['username'].setValue(res[0].username);
        // Be sure namesInUse is loaded, edit it, set username again to force validation
        setTimeout(() => {
          this.namesInUse.splice(this.namesInUse.indexOf(res[0].username), 1);
          entityForm.formGroup.controls['username'].setValue(res[0].username);
        }, 500);
        entityForm.formGroup.controls['full_name'].setValue(res[0].full_name);
        entityForm.formGroup.controls['email'].setValue(res[0].email);
        entityForm.formGroup.controls['password_disabled'].setValue(res[0].password_disabled);
        entityForm.formGroup.controls['locked'].setValue(res[0].locked);
        entityForm.formGroup.controls['sudo'].setValue(res[0].sudo);
        entityForm.formGroup.controls['microsoft_account'].setValue(res[0].microsoft_account);
        entityForm.formGroup.controls['sshpubkey'].setValue(res[0].sshpubkey);
        entityForm.formGroup.controls['groups'].setValue(res[0].groups);
        entityForm.formGroup.controls['home'].setValue(res[0].home);
        entityForm.formGroup.controls['shell'].setValue(res[0].shell);
        entityForm.setDisabled('password', true);
        entityForm.setDisabled('password_conf', true);

        this.fieldSets
          .hideConfig('password')
          .hideConfig('password_conf')
          .showConfig('password_edit')
          .showConfig('password_conf_edit');

        if (res[0].builtin) {
          entityForm.setDisabled('username', true);
          entityForm.formGroup.controls['uid'].setValue(res[0].uid);
          entityForm.setDisabled('uid', true);
          entityForm.setValue('group', res[0].group.id);
          entityForm.setDisabled('group', true);
          entityForm.setDisabled('home', true);
          entityForm.setDisabled('home_mode', true);
          this.fieldSets.hideConfig('home_mode');
        } else {
          entityForm.formGroup.controls['uid'].setValue(res[0].uid);
          entityForm.setDisabled('group', false);
          entityForm.setValue('group', res[0].group.id);
          entityForm.formGroup.controls['shell'].setValue(res[0].shell);
        }
      } else {
        this.ws.call('user.get_next_uid').pipe(untilDestroyed(this)).subscribe((next_uid) => {
          entityForm.formGroup.controls['uid'].setValue(next_uid);
        });
      }
      this.userService.shellChoices(this.pk).then((choices) => {
        this.shells = choices;
        this.shell = this.fieldSets.config('shell') as FormSelectConfig;
        this.shell.options = this.shells;

        if (entityForm.isNew && Array.isArray(this.shells) && this.shells.length > 0) {
          entityForm.formGroup.controls['shell'].setValue(this.shells[0].value);
        }
      });
    });
    if (!entityForm.isNew) {
      entityForm.submitFunction = this.submitFunction;
    }
  }

  cleanUid(value: any): any {
    delete value['password_conf'];
    if (value['uid'] === null) {
      delete value['uid'];
    }
    return value;
  }

  beforeSubmit(value: any): void {
    value.email = value.email === '' ? null : value.email;

    if (this.isNew) {
      const homeUser = value.home.substr(
        value.home.length - value.username.length,
      );
      if (value.home !== '/nonexistent') {
        if (value.username.toLowerCase() !== homeUser.toLowerCase()) {
          value.home = value.home + '/' + value.username;
        }
      }
      if (value.password_disabled) {
        value.sudo = false;
        value.locked = false;
      }
    } else {
      if (value['password_edit'] === value['password_conf_edit'] && value['password_edit'] !== '' && value['password_conf_edit'] !== '') {
        value['password'] = value['password_edit'];
        delete value['password_edit'];
        delete value['password_conf_edit'];
      } else if (value['password_edit'] === '' && value['password_conf_edit'] === '') {
        delete value['password_edit'];
        delete value['password_conf_edit'];
      }
      delete value['group_create'];
    }
  }

  submitFunction(entityForm: UserUpdate & { password_conf: string }): Observable<number> {
    delete entityForm['password_conf'];
    return this.ws.call('user.update', [this.pk, entityForm]);
  }

  fullNameBlur(): void {
    if (this.entityForm && this.entityForm.isNew) {
      let username: string;
      const fullname = this.entityForm.formGroup.controls.full_name.value.split(/[\s,]+/);
      if (fullname.length === 1) {
        username = fullname[0];
      } else {
        username = fullname[0][0] + fullname.pop();
      }
      if (username.length >= 8) {
        username = username.substring(0, 8);
      }
      if (username !== '') {
        this.entityForm.formGroup.controls['username'].setValue(username.toLocaleLowerCase());
        this.entityForm.formGroup.controls['username'].markAsTouched();
      }
    }
  }

  userNameBlur(): void {
    if (this.entityForm) {
      const username = this.entityForm.formGroup.controls.username.value;
      this.fieldSets.config('username').warnings = username.length > 8 ? helptext.user_form_blur_event2_warning : null;
    }
  }

  afterSubmit(): void {
    this.modalService.refreshTable();
  }
}
