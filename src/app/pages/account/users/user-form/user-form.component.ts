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
    },
    {
      type : 'input',
      name : 'bsdusr_username',
      placeholder : 'Username',
    },

    {
      type : 'checkbox',
      name : 'bsdusr_creategroup',
      placeholder : 'Create a new Primary Group for the user.',
      value : true,
    },

    {
      type : 'select',
      name : 'bsdusr_group',
      placeholder : 'Primary Group',
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
    },
    {
      type : 'permissions',
      name : 'bsdusr_mode',
      placeholder : 'Home Directory Mode',
    },
    {
      type : 'select',
      name : 'bsdusr_shell',
      placeholder : 'Shell',
      options : [],
    },
    {
      type : 'input',
      name : 'bsdusr_full_name',
      placeholder : 'Full Name',
    },
    {
      type : 'input',
      name : 'bsdusr_email',
      placeholder : 'Email',
    },
    {
      type : 'input',
      name : 'bsdusr_password',
      placeholder : 'Password',
      inputType : 'password'
    },
    {
      type : 'input',
      name : 'bsdusr_password_conf',
      placeholder : 'Confirm Password',
      inputType : 'password',
      validation : [ matchOtherValidator('bsdusr_password') ]

    },
    {
      type : 'checkbox',
      name : 'bsdusr_password_disabled',
      placeholder : 'Disable password login',
    },
    {
      type : 'checkbox',
      name : 'bsdusr_locked',
      placeholder : 'Lock user'
    },
    {
      type : 'checkbox',
      name : 'bsdusr_sudo',
      placeholder : 'Permit Sudo'
    },
  
    {
      type : 'checkbox',
      name : 'bsdusr_microsoft_account',
      placeholder : 'Microsoft Account'
    },

    {
      type : 'input',
      name : 'bsdusr_sshpubkey',
      placeholder : 'SSH Public Key'
    },
    // {
    //   type : 'select',
    //   name : 'bsdusr_aux_group',
    //   placeholder : 'Auxilary group',
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

  preInit(entityForm: any) {
    // if (!entityForm.isNew) {
    //   this.bsdusr_creategroup = _.find(this.fieldConfig, {name : "bsdusr_creategroup"});
    //   this.bsdusr_creategroup.isHidden = false;
    // }
  }

  afterInit(entityForm: any) {
    /* list groups */
    this.rest.get('account/groups/', {}).subscribe((res) => {
      this.bsdusr_group = _.find(this.fieldConfig, {name : "bsdusr_group"});
      this.bsdusr_aux_group = _.find(this.fieldConfig, {name : "bsdusr_aux_group"});
      for (let i = 0; i < res.data.length; i++) {
        this.bsdusr_group.options.push({ label : res.data[i].bsdgrp_group, value : res.data[i].id });
        //uncomment this when we are ready to bring back aux groups, hiding for now.
        //this.bsdusr_aux_group.options.push({label : res.data[i].bsdgrp_group, value : res.data[i].id})
        }

      // res.data.forEach((item) => {
      //   this.bsdusr_group.options.push(
      //       {label : item.bsdgrp_group, value : item.id});
      //   this.bsdusr_aux_group.options.push(
      //       {label : item.bsdgrp_group, value : item.id});
      //   /* if(item.bsdgrp_builtin === true)
      //    * entityForm.setDisabled('bsdusr_group', true); */
      // });
    });
    /* list users */
    this.rest.get(this.resource_name, {}).subscribe((res) => {
      let uid = 999;
      res.data.forEach((item, i) => {
        if (item.bsdusr_uid > uid)
          uid = item.bsdusr_uid;
        /*
        if(item.bsdusr_builtin === true) {
          entityForm.setDisabled('bsdusr_uid', true);
          entityForm.setDisabled('bsdusr_home', true);
        }
        */
      });

      if (entityForm.data.bsdusr_home) {
        this.storageService.filesystemStat(entityForm.data.bsdusr_home).subscribe(stat => {
          entityForm.formGroup.controls['bsdusr_mode'].setValue(stat.mode.toString(8).substring(2,5));
        });
      } else {
        entityForm.formGroup.controls['bsdusr_mode'].setValue('755');
      }

      if (!entityForm.isNew) {
        entityForm.setDisabled('bsdusr_username', true);
        entityForm.setDisabled('bsdusr_creategroup', true);
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
        uid += 1;
        entityForm.formGroup.controls['bsdusr_uid'].setValue(uid);
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
