import {Placeholder} from '@angular/compiler/src/i18n/i18n_ast';
import {Component} from '@angular/core';
import {Router} from '@angular/router';
import * as _ from 'lodash';

import {
  NetworkService,
  RestService,
  WebSocketService,
  StorageService
} from '../../../../services/';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';
import {
  matchOtherValidator
} from '../../../common/entity/entity-form/validators/password-validation';
import {  DialogService } from '../../../../services/';
import {Validators} from '@angular/forms';

@Component({
  selector : 'app-user-form',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class UserFormComponent {

  protected resource_name: string = 'account/users/';
  protected addCall = 'user.create';
  protected route_success: string[] = ['account', 'users' ];
  protected isEntity: boolean = true;

  public fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'uid',
      placeholder : 'User ID',
      tooltip : 'By convention, user accounts have an ID greater than\
 1000 and system accounts have an ID equal to the default port number\
 used by the service.',
      validation : [ Validators.required ]
    },
    {
      type : 'input',
      name : 'username',
      placeholder : 'Username',
      tooltip : 'Maximum length is 16 characters, although using 8 or\
 less is recommended for interoperability. Usernames cannot begin with\
 a hyphen or contain a space, tab, or these characters:\
 <b>, : + & # %^ ( ) ! @ ~ * ? < > =</b> . A <b>$</b> can only be used\
 as the last character.',
      validation : [ Validators.required ]
    },

    {
      type : 'checkbox',
      name : 'group_create',
      placeholder : 'Create a new Primary Group for the user.',
      tooltip : 'By default, a primary group with the same name as the\
 user is created. Uncheck this box to select a different primary group\
 name.',
      value : true,
      isHidden: false
    },

    {
      type : 'select',
      name : 'group',
      placeholder : 'Primary Group',
      tooltip : 'For security reasons, FreeBSD will not give a user\
 <b>su</b> permissions if <i>wheel</i> is their primary group.',
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
      type : 'explorer',
      initial: '/mnt',

      name: 'home',
      placeholder: 'Home Directory',
      value: '/nonexistent',
      tooltip : 'Browse to the name of an <b>existing</b> volume or\
      dataset that the user will be assigned permission to access.',
    },
    {
      type : 'permissions',
      name : 'home_mode',
      placeholder : 'Home Directory Mode',
      tooltip : 'Sets default Unix permissions of the user home\
 directory. Read-only for built-in users.',
    },
    {
      type : 'select',
      name : 'shell',
      placeholder : 'Shell',
      tooltip : 'Select the shell to use for local and SSH logins.',
      options : [],
    },
    {
      type : 'input',
      name : 'full_name',
      placeholder : 'Full Name',
      tooltip : 'Entering a name is required. Spaces are allowed.',
      validation : [ Validators.required ]
    },
    {
      type : 'input',
      name : 'email',
      placeholder : 'Email',
      tooltip : 'Associate an email address with the account',
    },
    {
      type : 'input',
      name : 'password',
      placeholder : 'Password',
      tooltip : 'Required unless <b>Disable password login</b> is\
 checked. Passwords cannot contain a <b>?</b>.',
      inputType : 'password',
    },
    {
      type : 'input',
      name : 'password_conf',
      placeholder : 'Confirm Password',
      inputType : 'password',
      validation : [ matchOtherValidator('password') ],

    },
    {
      type : 'checkbox',
      name : 'password_disabled',
      placeholder : 'Disable password login',
      tooltip : 'Disables password logins and authentication to SMB\
 shares. Checking this grays out <b>Lock user</b> and\
 <b>Permit Sudo</b>, which are mutually exclusive.',
    },
    {
      type : 'checkbox',
      name : 'locked',
      placeholder : 'Lock user',
      tooltip : 'Check this to prevent the user from logging in until\
 the account is unlocked (this box is unchecked). Checking this box\
 grays out <b>Disable password login</b> which is mutually exclusive.',
    },
    {
      type : 'checkbox',
      name : 'sudo',
      placeholder : 'Permit Sudo',
      tooltip : 'Check this to give members of the group permission to\
 use <a href="https://www.sudo.ws/" target="_blank">sudo</a>.',
    },

    {
      type : 'checkbox',
      name : 'microsoft_account',
      placeholder : 'Microsoft Account',
      tooltip : 'Check this if the user will be connecting from a\
      Windows 8 or higher system.',
    },

    {
      type : 'textarea',
      name : 'sshpubkey',
      placeholder : 'SSH Public Key',
      tooltip : 'Paste the <b>public</b> SSH key of the user for any\
      key-based authentication. <b>Do not paste the private key!</b>',
    },
    {
      type : 'select',
      name : 'groups',
      placeholder : 'Auxilary group',
      options : [],
      multiple : true
    },

  ];
  private home: any;
  private mode: any;
  private shells: any;
  private shell: any;
  private group: any;
  private groups: any;
  private creategroup: any;
  private group_create: any;

  constructor(protected router: Router, protected rest: RestService,
              protected ws: WebSocketService, protected storageService: StorageService,
              private dialog:DialogService ) {}


  afterInit(entityForm: any) {
    if (!entityForm.isNew) {
      _.find(this.fieldConfig, {name : "group_create"}).isHidden = true;
      entityForm.formGroup.controls['group_create'].setValue(false);
    }
    /* list groups */
    this.ws.call('group.query').subscribe((res) => {
      this.group = _.find(this.fieldConfig, {name : "group"});
      this.groups = _.find(this.fieldConfig, {name : "groups"});
      for (let i = 0; i < res.length; i++) {
        this.group.options.push({ label : res[i].group, value : res[i].id });
        this.groups.options.push({label : res[i].group, value : res[i].id})
        }

    });
    /* list users */
    let filter = [];
    filter.push("id");
    filter.push("=");
    filter.push(entityForm.pk);
    this.ws.call('user.query',[[filter]]).subscribe((res) => {
      if (res.length !== 0 && res[0].home !== '/nonexistent') {
        this.storageService.filesystemStat(res[0].home).subscribe(stat => {
          entityForm.formGroup.controls['home_mode'].setValue(stat.mode.toString(8).substring(2,5));
        });
      } else {
        entityForm.formGroup.controls['home_mode'].setValue('755');
      }

      if (!entityForm.isNew) {
        entityForm.setDisabled('username', true);
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
        if (res[0].builtin) {
          entityForm.formGroup.controls['uid'].setValue(res[0].uid);
          entityForm.setDisabled('uid', true);
          entityForm.setValue('group',res[0].group.id);
          entityForm.setDisabled('group',true);
          entityForm.setDisabled('home',true);
          entityForm.setDisabled('home_mode',true);
          _.find(this.fieldConfig, {name : "home_mode"}).isHidden = true;
        } else {
          entityForm.formGroup.controls['uid'].setValue(res[0].uid);
          entityForm.setDisabled('group',false);
          entityForm.setValue('group',res[0].group.id);
          entityForm.formGroup.controls['shell'].setValue(res[0].shell);

        }
      } else {
        this.ws.call('user.get_next_uid').subscribe((res)=>{
          entityForm.formGroup.controls['uid'].setValue(res);
        })
      }
    });
    /* list shells */
    entityForm.ws.call('notifier.choices', [ 'SHELL_CHOICES' ])
        .subscribe((res) => {
          this.shell = _.find(this.fieldConfig, {name : "shell"});
          this.shells = res;
          let bsduser_shell = this.shell
          res.forEach((item) => {
            this.shell.options.push({label : item[1], value : item[0]});
          });
          entityForm.formGroup.controls['shell'].setValue(
              this.shells[1][0]);
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

  submitFunction(this: any, entityForm: any, ){
    delete entityForm['uid']
    delete entityForm['group_create']
    delete entityForm['password_conf']
    return this.ws.call('user.update', [this.pk, entityForm]);
  }
}
