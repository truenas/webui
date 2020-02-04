import { Component } from '@angular/core';
import { Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FieldSets } from 'app/pages/common/entity/entity-form/classes/field-sets';
import * as _ from 'lodash';
import helptext from '../../../../helptext/account/user-form';
import { AppLoaderService, StorageService, UserService, WebSocketService, ValidationService } from '../../../../services/';
import { forbiddenValues } from '../../../common/entity/entity-form/validators/forbidden-values-validation';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';

@Component({
  selector : 'app-user-form',
  template : `<entity-form [conf]="this"></entity-form>`,
  providers: [UserService]
})
export class UserFormComponent {

  protected queryCall = 'user.query';
  protected addCall = 'user.create';
  protected editCall = 'user.update';
  protected route_success: string[] = ['account', 'users' ];
  protected pk: string;
  protected queryKey = 'id';
  protected isEntity  = true;
  protected isNew: boolean;
  public entityForm: any;
  protected namesInUse = [];

  public fieldSetDisplay  = 'default';//default | carousel | stepper
  public fieldSets: FieldSets = new FieldSets([
    {
      name: helptext.user_form_title_name,
      class: helptext.user_form_title_class,
      label:true,
      config:[
        {
          type : 'input',
          name : helptext.user_form_full_name_name,
          placeholder : helptext.user_form_full_name_placeholder,
          tooltip : helptext.user_form_full_name_tooltip,
          required: true,
          validation : helptext.user_form_full_name_validation,
          blurStatus : true,
          blurEvent: this.blurEvent,
          parent: this
        },
        {
          type : 'input',
          name : helptext.user_form_username_name,
          placeholder : helptext.user_form_username_placeholder,
          tooltip : helptext.user_form_username_tooltip,
          required: true,
          validation: [
            Validators.required,
            Validators.pattern(UserService.VALIDATOR_NAME),
            Validators.maxLength(16),
            forbiddenValues(this.namesInUse)
          ],
          blurStatus : true,
          blurEvent: this.blurEvent2,
          parent: this
        },
        {
          type : 'input',
          inputType: 'email',
          name : helptext.user_form_email_name,
          placeholder : helptext.user_form_email_placeholder,
          tooltip : helptext.user_form_email_tooltip,
          validation: [Validators.email]
        },
        {
          type : 'input',
          name : helptext.user_form_password_name,
          placeholder : helptext.user_form_password_placeholder,
          tooltip : helptext.user_form_password_tooltip,
          inputType : 'password',
          togglePw: true,
          required: true,
          validation : helptext.user_form_password_validation,
          isHidden: false
        },
        {
          type : 'input',
          name : helptext.user_form_password_confirm_name,
          placeholder : helptext.user_form_password_confirm_placeholder,
          inputType : 'password',
          required: true,
          validation : this.validationService.matchOtherValidator('password'),
          isHidden: false
        },
        {
          type : 'input',
          name : helptext.user_form_password_edit_name,
          placeholder : helptext.user_form_password_edit_placeholder,
          tooltip : helptext.user_form_password_edit_tooltip,
          inputType : 'password',
          togglePw: true,
          validation : helptext.user_form_password_edit_validation,
          isHidden: true
        },
        {
          type : 'input',
          name : helptext.user_form_password_edit_confirm_name,
          placeholder : helptext.user_form_password_edit_confirm_placeholder,
          inputType : 'password',
          validation : this.validationService.matchOtherValidator('password_edit'),
          isHidden: true
        },
      ]
    },
    {
      name:'divider',
      divider:true
    },
    {
      name:helptext.user_form_ids_groups_title,
      class: helptext.user_form_ids_groups_title_class,
      label:true,
      config:[
        {
          type : 'input',
          name : helptext.user_form_uid_name,
          placeholder : helptext.user_form_uid_placeholder,
          tooltip : helptext.user_form_uid_tooltip,
          required: true,
          validation : helptext.user_form_uid_validation
        },
        {
          type : 'checkbox',
          name : helptext.user_form_group_create_name,
          placeholder : helptext.user_form_group_create_placeholder,
          tooltip : helptext.user_form_group_create_tooltip,
          value : true,
          isHidden: false
        },
        {
          type : 'select',
          name : helptext.user_form_primary_group_name,
          placeholder : helptext.user_form_primary_group_placeholder,
          tooltip : helptext.user_form_primary_group_tooltip,
          options : [],
          relation : [
            {
              action : 'DISABLE',
              when : [ {
                name : 'group_create',
                value : true,
              } ]
            },
          ],
        },
        {
          type : 'select',
          name : helptext.user_form_aux_groups_name,
          placeholder : helptext.user_form_aux_groups_placeholder,
          tooltip : helptext.user_form_aux_groups_tooltip,
          options : [],
          multiple : true
        },
      ]
    },
    {
      name:'divider',
      divider:true
    },
    {
      name: helptext.user_form_dirs_title_name,
      class: helptext.user_form_dirs_title_class,
      label:true,
      width:'50%',
      config:[
        {
          type : 'explorer',
          class : helptext.user_form_dirs_explorer_class,
          initial: '/mnt',
          explorerType: 'directory',
          name: helptext.user_form_dirs_explorer_name,
          placeholder: helptext.user_form_dirs_explorer_placeholder,
          value: helptext.user_form_dirs_explorer_value,
          tooltip : helptext.user_form_dirs_explorer_tooltip,
        },
        {
          type : 'permissions',
          name : helptext.user_form_home_dir_permissions_name,
          placeholder : helptext.user_form_home_dir_permissions_placeholder,
          tooltip : helptext.user_form_home_dir_permissions_tooltip,
        },
      ]
    },
    {
      name: helptext.user_form_auth_title_name,
      class: helptext.user_form_auth_title_class,
      label:true,
      width:'50%',
      config:[
        {
          type : 'textarea',
          name : helptext.user_form_auth_sshkey_name,
          placeholder : helptext.user_form_auth_sshkey_placeholder,
          tooltip : helptext.user_form_auth_sshkey_tooltip,
        },
        {
          type : 'select',
          name : helptext.user_form_auth_pw_enable_name,
          placeholder : helptext.user_form_auth_pw_enable_placeholder,
          tooltip : helptext.user_form_auth_pw_enable_tooltip,
          options : [
            {label:helptext.user_form_auth_pw_enable_label_yes, value: true },
            {label: helptext.user_form_auth_pw_enable_label_no, value: false },
          ],
          value: false
        },
        {
          type : 'select',
          name : helptext.user_form_shell_name,
          placeholder : helptext.user_form_shell_placeholder,
          tooltip : helptext.user_form_shell_tooltip,
          options : [],
        },
        {
          type : 'checkbox',
          name : helptext.user_form_lockuser_name,
          placeholder : helptext.user_form_lockuser_placeholder,
          tooltip : helptext.user_form_lockuser_tooltip,
          isHidden: false
        },
        {
          type : 'checkbox',
          name : helptext.user_form_sudo_name,
          placeholder : helptext.user_form_sudo_placeholder,
          tooltip : helptext.user_form_sudo_tooltip,
          isHidden: false
        },
        {
          type : 'checkbox',
          name : helptext.user_form_microsoft_name,
          placeholder : helptext.user_form_microsoft_placeholder,
          tooltip : helptext.user_form_microsoft_tooltip,
        },
        {
          type: 'checkbox',
          name: helptext.user_form_smb_name,
          placeholder: helptext.user_form_smb_placeholder,
          tooltip: helptext.user_form_smb_tooltip,
          value: true
        }
      ]
    },
    {
      name:'divider',
      divider:true
    }
  ]);

  protected custActions = [
    {
      id: 'download_sshpubkey',
      name: helptext.user_form_download_key,
      function: () => {
        const name = this.entityForm.formGroup.controls['username'].value;
        const key = this.entityForm.formGroup.controls['sshpubkey'].value;
        const filename = name + '_public_key_rsa';
        const blob = new Blob([key], {type: 'text/plain'});
        this.storageService.downloadBlob(blob, filename);
      }
    }
  ]



  private shells: any;
  private shell: any;
  private group: any;
  private groups: any;
  private password_disabled: any;

  constructor(protected router: Router, 
              protected ws: WebSocketService, 
              protected storageService: StorageService,
              public loader: AppLoaderService,
              private userService: UserService,
              protected validationService: ValidationService
              ) {
      this.ws.call('user.query').subscribe(
        (res)=>{
          this.namesInUse.push(...res.map(user => user.username));
        }
      );
    };

   afterInit(entityForm: EntityFormComponent) {
    this.pk = entityForm.pk;
    this.loader.callStarted.emit();
    this.entityForm = entityForm;
    this.isNew = entityForm.isNew;
    this.password_disabled = entityForm.formGroup.controls['password_disabled'];
    if (!entityForm.isNew) {
      this.fieldSets
        .showConfig("password_edit")
        .showConfig("password_conf_edit");
      entityForm.setDisabled('password', true, true);
      entityForm.setDisabled('password_conf', true, true);
      this.password_disabled.valueChanges.subscribe((password_disabled)=>{
        if (!password_disabled) {
          entityForm.formGroup.controls['sudo'].setValue(false);
          entityForm.formGroup.controls['locked'].setValue(false);
        }
        this.fieldSets
          .toggleConfigVisibility("locked", password_disabled)
          .toggleConfigVisibility("sudo", password_disabled);
        entityForm.setDisabled('password_edit', password_disabled);
        entityForm.setDisabled('password_conf_edit', password_disabled);
      });
    } else {
      entityForm.setDisabled('password_edit', true, true);
      entityForm.setDisabled('password_conf_edit', true, true);
      this.fieldSets
        .showConfig("password")
        .showConfig("password_conf");
      this.password_disabled.valueChanges.subscribe((password_disabled)=>{
        if (!password_disabled) {
          entityForm.formGroup.controls['sudo'].setValue(false);
          entityForm.formGroup.controls['locked'].setValue(false);
        }
        this.fieldSets
          .toggleConfigVisibility("locked", password_disabled)
          .toggleConfigVisibility("sudo", password_disabled);
        entityForm.setDisabled('password', password_disabled);
        entityForm.setDisabled('password_conf', password_disabled);
      });
    }


    if (!entityForm.isNew) {
      this.fieldSets.hideConfig("group_create");
      entityForm.formGroup.controls['group_create'].setValue(false);
    }

    /* list groups */
    this.ws.call('group.query').subscribe((res) => {
      this.loader.callDone.emit(status);
      this.group = this.fieldSets.config("group");
      this.groups = this.fieldSets.config("groups");
      for (let i = 0; i < res.length; i++) {
        this.group.options.push({ label : res[i].group, value : res[i].id });
        this.groups.options.push({label : res[i].group, value : res[i].id})
      }  
    });

    /* list users */
    const filter = ["id", "=", parseInt(this.pk, 10)];
    this.ws.call('user.query',[[filter]]).subscribe(async (res) => {
      if (res.length !== 0 && res[0].home !== '/nonexistent') {
        this.storageService.filesystemStat(res[0].home).subscribe(stat => {
          entityForm.formGroup.controls['home_mode'].setValue(stat.mode.toString(8).substring(2,5));
        });
      } else {
        entityForm.formGroup.controls['home_mode'].setValue('755');
      }

      if (!entityForm.isNew) {
        entityForm.setDisabled('username', true);
        entityForm.setDisabled('uid', true);
        entityForm.formGroup.controls['username'].setValue(res[0].username);
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
          .hideConfig("password")
          .hideConfig("password_conf")
          .showConfig("password_edit")
          .showConfig("password_conf_edit");

        if (res[0].builtin) {
          entityForm.formGroup.controls['uid'].setValue(res[0].uid);
          entityForm.setDisabled('uid', true);
          entityForm.setValue('group',res[0].group.id);
          entityForm.setDisabled('group',true);
          entityForm.setDisabled('home',true);
          entityForm.setDisabled('home_mode',true);
          this.fieldSets.hideConfig("home_mode");
        } else {
          entityForm.formGroup.controls['uid'].setValue(res[0].uid);
          entityForm.setDisabled('group',false);
          entityForm.setValue('group',res[0].group.id);
          entityForm.formGroup.controls['shell'].setValue(res[0].shell);
        }
      } else {
        this.ws.call('user.get_next_uid').subscribe((next_uid)=>{
          entityForm.formGroup.controls['uid'].setValue(next_uid);
        })
      }
      this.userService.shellChoices(parseInt(this.pk, 10)).then(choices => {
        this.shells = choices;
        this.shell = this.fieldSets.config("shell");
        this.shell.options = this.shells;

        if (entityForm.isNew && Array.isArray(this.shells) && this.shells.length > 0) {
          entityForm.formGroup.controls['shell'].setValue(this.shells[0].value);
        }
      });
    });
    if (!entityForm.isNew){
      entityForm.submitFunction = this.submitFunction;
    }

  }

  clean_uid(value) {
    delete value['password_conf'];
    if (value['uid'] === null) {
      delete value['uid'];
    }
    return value;
  }

  beforeSubmit(entityForm: any){
    entityForm.email = entityForm.email === '' ? null : entityForm.email;

    if (this.isNew){
      const home_user = entityForm.home.substr(
        entityForm.home.length - entityForm.username.length
      );
      if(entityForm.home !=='/nonexistent'){
        if(entityForm.username !== home_user){
          entityForm.home = entityForm.home+'/'+ entityForm.username;
        }
      }
      if(entityForm.password_disabled){
        entityForm.sudo = false;
        entityForm.locked = false;
      }

    } else {
      if (entityForm['password_edit']===entityForm['password_conf_edit'] && entityForm['password_edit'] !== '' && entityForm['password_conf_edit'] !== ''){
        entityForm['password'] = entityForm['password_edit'];
        delete entityForm['password_edit'];
        delete entityForm['password_conf_edit'];
      } else if(entityForm['password_edit'] === '' && entityForm['password_conf_edit'] === '') {
        delete entityForm['password_edit'];
        delete entityForm['password_conf_edit'];
      }
      delete entityForm['group_create'];
    }
  }
  submitFunction(this: any, entityForm: any, ){
    delete entityForm['password_conf']
    return this.ws.call('user.update', [this.pk, entityForm]);
  }
  blurEvent(parent){
    if(parent.entityForm && parent.entityForm.isNew) {
      let username: string
      const fullname = parent.entityForm.formGroup.controls.full_name.value.split(/[\s,]+/);
      if(fullname.length === 1){
        username = fullname[0];
      } else {
        username = fullname[0][0]+fullname.pop();
      }
      if(username.length >= 8){
        username = username.substring(0, 8);
      }
      if(username !=='') {
        parent.entityForm.formGroup.controls['username'].setValue(username.toLocaleLowerCase());
        parent.entityForm.formGroup.controls['username'].markAsTouched();
      }
    };
  }
  blurEvent2(parent: { fieldSets: FieldSets, entityForm: EntityFormComponent }) {
    if(parent.entityForm) {
      const username = parent.entityForm.formGroup.controls.username.value;
      parent.fieldSets.config("username").warnings =
        username.length > 8 ? helptext.user_form_blur_event2_warning : null;
    };
  }
}
