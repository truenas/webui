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
  protected route_success: string[] = ['account', 'users' ];
  protected isEntity: boolean = true;

  public fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'bsdusr_uid',
      placeholder : 'User ID',
      tooltip : 'By convention, user accounts have an ID greater than\
 1000 and system accounts have an ID equal to the default port number\
 used by the service.',
      validation : [ Validators.required ]
    },
    {
      type : 'input',
      name : 'bsdusr_username',
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
      name : 'bsdusr_creategroup',
      placeholder : 'Create a new Primary Group for the user.',
      tooltip : 'By default, a primary group with the same name as the\
 user is created. Uncheck this box to select a different primary group\
 name.',
      value : true,
      isHidden: false
    },

    {
      type : 'select',
      name : 'bsdusr_group',
      placeholder : 'Primary Group',
      tooltip : 'For security reasons, FreeBSD will not give a user\
 <b>su</b> permissions if <i>wheel</i> is their primary group.',
      options : [],
      relation : [
        {
          action : 'DISABLE',
          when : [ {
            name : 'bsdusr_creategroup',
            value : true,
          } ]
        },
      ],
    },
    {
      type : 'explorer',
      initial: '/mnt',
      name : 'bsdusr_home',
      placeholder : 'Home Directory',
      tooltip : 'Browse to the name of an <b>existing</b> volume or\
 dataset that the user will be assigned permission to access.',
    },
    {
      type : 'permissions',
      name : 'bsdusr_mode',
      placeholder : 'Home Directory Mode',
      tooltip : 'Sets default Unix permissions of the user home\
 directory. Read-only for built-in users.',
    },
    {
      type : 'select',
      name : 'bsdusr_shell',
      placeholder : 'Shell',
      tooltip : 'Select the shell to use for local and SSH logins.',
      options : [],
    },
    {
      type : 'input',
      name : 'bsdusr_full_name',
      placeholder : 'Full Name',
      tooltip : 'Entering a name is required. Spaces are allowed.',
      validation : [ Validators.required ]
    },
    {
      type : 'input',
      name : 'bsdusr_email',
      placeholder : 'Email',
      tooltip : 'Associate an email address with the account',
    },
    {
      type : 'input',
      name : 'bsdusr_password',
      placeholder : 'Password',
      tooltip : 'Required unless <b>Disable password login</b> is\
 checked. Passwords cannot contain a <b>?</b>.',
      inputType : 'password',
    },
    {
      type : 'input',
      name : 'bsdusr_password_conf',
      placeholder : 'Confirm Password',
      inputType : 'password',
      validation : [ matchOtherValidator('bsdusr_password') ],

    },
    {
      type : 'checkbox',
      name : 'bsdusr_password_disabled',
      placeholder : 'Disable password login',
      tooltip : 'Disables password logins and authentication to SMB\
 shares. Checking this grays out <b>Lock user</b> and\
 <b>Permit Sudo</b>, which are mutually exclusive.',
    },
    {
      type : 'checkbox',
      name : 'bsdusr_locked',
      placeholder : 'Lock user',
      tooltip : 'Check this to prevent the user from logging in until\
 the account is unlocked (this box is unchecked). Checking this box\
 grays out <b>Disable password login</b> which is mutually exclusive.',
    },
    {
      type : 'checkbox',
      name : 'bsdusr_sudo',
      placeholder : 'Permit Sudo',
      tooltip : 'Check this to give members of the group permission to\
 use <a href="https://www.sudo.ws/" target="_blank">sudo</a>.',
    },

    {
      type : 'checkbox',
      name : 'bsdusr_microsoft_account',
      placeholder : 'Microsoft Account',
      tooltip : 'Check this if the user will be connecting from a\
 Windows 8 or higher system.',
    },

    {
      type : 'textarea',
      name : 'bsdusr_sshpubkey',
      placeholder : 'SSH Public Key',
      tooltip : 'Paste the <b>public</b> SSH key of the user for any\
 key-based authentication. <b>Do not paste the private key!</b>',
    },
    // {
    //   type : 'select',
    //   name : 'bsdusr_aux_group',
    //   placeholder : 'Auxiliary group',
    //   tooltip : 'Select any additional groups to which the user is to\
    //   be added.',
    //   options : [],
    //   multiple : true
    // },

  ];
  private home: any;
  private mode: any;
  private shells: any;
  private bsdusr_shell: any;
  private bsdusr_group: any;
  private bsdusr_aux_group: any;
  private bsdusr_creategroup: any;

  constructor(protected router: Router, protected rest: RestService,
              protected ws: WebSocketService, protected storageService: StorageService,
              private dialog:DialogService ) {}


  afterInit(entityForm: any) {
    if (!entityForm.isNew) {
      _.find(this.fieldConfig, {name : "bsdusr_creategroup"}).isHidden = true;
    }
    /* list groups */
    this.rest.get('account/groups/', {}).subscribe((res) => {
      this.bsdusr_group = _.find(this.fieldConfig, {name : "bsdusr_group"});
      this.bsdusr_aux_group = _.find(this.fieldConfig, {name : "bsdusr_aux_group"});
      for (let i = 0; i < res.data.length; i++) {
        this.bsdusr_group.options.push({ label : res.data[i].bsdgrp_group, value : res.data[i].id });
        //uncomment this when we are ready to bring back aux groups, hiding for now.
        //this.bsdusr_aux_group.options.push({label : res.data[i].bsdgrp_group, value : res.data[i].id})
        }

    });
    /* list users */
    this.rest.get(this.resource_name, {}).subscribe((res) => {

      if (entityForm.data.bsdusr_home) {
        this.storageService.filesystemStat(entityForm.data.bsdusr_home).subscribe(stat => {
          entityForm.formGroup.controls['bsdusr_mode'].setValue(stat.mode.toString(8).substring(2,5));
        });
      } else {
        entityForm.formGroup.controls['bsdusr_mode'].setValue('755');
      }

      if (!entityForm.isNew) {
        entityForm.setDisabled('bsdusr_username', true);
        if (entityForm.data.bsdusr_builtin === true) {
          entityForm.formGroup.controls['bsdusr_uid'].setValue(
              entityForm.data.bsdusr_uid);
          entityForm.setDisabled('bsdusr_uid', true);
          entityForm.setDisabled('bsdusr_home', true);
        } else {
          entityForm.formGroup.controls['bsdusr_uid'].setValue(
              entityForm.data.bsdusr_uid);
        }
      } else {
        this.ws.call('user.get_next_uid').subscribe((res)=>{
          entityForm.formGroup.controls['bsdusr_uid'].setValue(res);
        })
      }
    });
    /* list shells */
    entityForm.ws.call('notifier.choices', [ 'SHELL_CHOICES' ])
        .subscribe((res) => {
          this.bsdusr_shell = _.find(this.fieldConfig, {name : "bsdusr_shell"});
          this.shells = res;
          let bsduser_shell = this.bsdusr_shell
          res.forEach((item) => {
            this.bsdusr_shell.options.push({label : item[1], value : item[0]});
          });
          entityForm.formGroup.controls['bsdusr_shell'].setValue(
              this.shells[1][0]);
        });
  }

  errorReport(res) {
    this.dialog.errorReport(res.code, res.error.error_message, res.error.traceback);
  }

  clean_uid(value) {
    if (value['uid'] === null) {
      delete value['uid'];
    }
    return value;
  }
}
