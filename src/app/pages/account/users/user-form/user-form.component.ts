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
      validation : [ Validators.required ]
    },
    {
      type : 'input',
      name : 'username',
      placeholder : 'Username',
      validation : [ Validators.required ]
    },

    {
      type : 'checkbox',
      name : 'group_create',
      placeholder : 'Create a new Primary Group for the user.',
      value : true,
      isHidden: false
    },

    {
      type : 'select',
      name : 'group',
      placeholder : 'Primary Group',
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
      value: '/nonexistent'
    },
    {
      type : 'permissions',
      name : 'home_mode',
      placeholder : 'Home Directory Mode',
    },
    {
      type : 'select',
      name : 'shell',
      placeholder : 'Shell',
      options : [],
    },
    {
      type : 'input',
      name : 'full_name',
      placeholder : 'Full Name',
      validation : [ Validators.required ]
    },
    {
      type : 'input',
      name : 'email',
      placeholder : 'Email',
    },
    {
      type : 'input',
      name : 'password',
      placeholder : 'Password',
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
    },
    {
      type : 'checkbox',
      name : 'locked',
      placeholder : 'Lock user'
    },
    {
      type : 'checkbox',
      name : 'sudo',
      placeholder : 'Permit Sudo'
    },
  
    {
      type : 'checkbox',
      name : 'microsoft_account',
      placeholder : 'Microsoft Account'
    },

    {
      type : 'textarea',
      name : 'sshpubkey',
      placeholder : 'SSH Public Key'
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
