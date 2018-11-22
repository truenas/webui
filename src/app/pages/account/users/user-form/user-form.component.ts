import {Component} from '@angular/core';
import {Router} from '@angular/router';
import * as _ from 'lodash';

import { T } from '../../../../translate-marker';
import {
  RestService,
  WebSocketService,
  StorageService
} from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import {
  matchOtherValidator
} from '../../../common/entity/entity-form/validators/password-validation';
import {  DialogService } from '../../../../services/';
import {Validators} from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector : 'app-user-form',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class UserFormComponent {

  protected resource_name = 'account/users/';
  protected addCall = 'user.create';
  protected route_success: string[] = ['account', 'users' ];
  protected isEntity  = true;
  protected isNew: boolean;
  public entityForm: any;

  public fieldSetDisplay  = 'default';//default | carousel | stepper
  public fieldConfig: FieldConfig[] = [];
  public fieldSets: FieldSet[] = [
    {
      name:'Name & Contact',
      class:'name-and-contact',
      label:true,
      config:[
        {
          type : 'input',
          name : 'full_name',
          placeholder : T('Full Name'),
          tooltip : T('Spaces are allowed.'),
          required: true,
          validation : [ Validators.required ],
          blurStatus : true,
          blurEvent: this.blurEvent,
          parent: this
        },
        {
          type : 'input',
          name : 'username',
          placeholder : T('Username'),
          tooltip : T('Enter an alphanumeric username of eight to\
                      sixteen characters. Keeping usernames to eight\
                      characters or less is recommended for\
                      compatibility with legacy clients.\
                      Usernames cannot begin with a hyphen\
                      (<b>-</b>) or contain a space, tab, or these\
                      characters: <b>, : + & # %^ ( ) ! @ ~ * ? < > =</b>\
                      Note that <b>$</b> can only be used as the last\
                      character.'),
          required: true,
          validation : [ Validators.required, Validators.pattern('[a-z_A-Z_][a-zA-Z0-9_-]*[$]?'), Validators.maxLength(16) ],
          blurStatus : true,
          blurEvent: this.blurEvent2,
          parent: this
        },
        {
          type : 'input',
          name : 'email',
          placeholder : T('Email'),
          tooltip : T('Enter the email address of the new user.'),
        },
        {
          type : 'input',
          name : 'password',
          placeholder : T('Password'),
          tooltip : T('Required unless <b>Enable password login</b> is\
                      <i>No</i>. Passwords cannot contain a <b>?</b>.'),
          inputType : 'password',
          togglePw: true,
          required: true,
          validation : [ Validators.pattern('^[^?]*$'), Validators.required ],
          isHidden: false
        },
        {
          type : 'input',
          name : 'password_conf',
          placeholder : T('Confirm Password'),
          inputType : 'password',
          required: true,
          validation : [ matchOtherValidator('password'), Validators.pattern('^[^?]*$'), Validators.required ],
          isHidden: false
        },
        {
          type : 'input',
          name : 'password_edit',
          placeholder : T('Password'),
          tooltip : T('Required unless <b>Enable password login</b> is\
                      <i>No</i>. Passwords cannot contain a <b>?</b>.'),
          inputType : 'password',
          togglePw: true,
          validation : [ Validators.pattern('^[^?]*$') ],
          isHidden: true
        },
        {
          type : 'input',
          name : 'password_conf_edit',
          placeholder : T('Confirm Password'),
          inputType : 'password',
          validation : [ matchOtherValidator('password_edit'), Validators.pattern('^[^?]*$') ],
          isHidden: true
        },
      ]
    },
    {
      name:'divider',
      divider:true
    },
    {
      name:'ID & Groups',
      class:'id-and-groups',
      label:true,
      config:[
        {
          type : 'input',
          name : 'uid',
          placeholder : T('User ID'),
          tooltip : T('User accounts have an ID greater than 1000 and\
                      system accounts have an ID equal to the default\
                      port number used by the service.'),
          required: true,
          validation : [ Validators.required ]
        },
        {
          type : 'checkbox',
          name : 'group_create',
          placeholder : T('New Primary Group'),
          tooltip : T('Set to create a new primary group with the same name as\
                      the user. Unset to select an existing group for\
                      the user.'),
          value : true,
          isHidden: false
        },
        {
          type : 'select',
          name : 'group',
          placeholder : T('Primary Group'),
          tooltip : T('New users are not given <b>su</b> permissions if\
                      <i>wheel</i> is their primary group.'),
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
          name : 'groups',
          placeholder : T('Auxiliary Groups'),
          tooltip : T('Add this user to additional groups.'),
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
      name:'Directories & Permissions',
      class:'directories-and-permissions',
      label:true,
      width:'50%',
      config:[
        {
          type : 'explorer',
          class : 'meExplorer',
          initial: '/mnt',
          explorerType: 'directory',
          name: 'home',
          placeholder: T('Home Directory'),
          value: '/nonexistent',
          tooltip : T('Define an <b>existing</b> pool or dataset as\
                      the user home directory and adjust the\
                      permissions.'),
        },
        {
          type : 'permissions',
          name : 'home_mode',
          placeholder : T('Home Directory Permissions'),
          tooltip : T('Sets default Unix permissions of the user home\
                      directory. This is read-only for built-in users.'),
        },
      ]
    },
    {
      name:'Authentication',
      class:'authentication',
      label:true,
      width:'50%',
      config:[
        {
          type : 'textarea',
          name : 'sshpubkey',
          placeholder : T('SSH Public Key'),
          tooltip : T('Enter or paste the <b>public</b> SSH key of the\
                      user for any key-based authentication. <b>Do not\
                      paste the private key.</b>'),
        },
        {
          type : 'select',
          name : 'password_disabled',
          placeholder : T('Enable password login'),
          tooltip : T('Enable password logins and authentication to SMB\
                      shares. Selecting <b>No</b> removes the <b>Lock\
                      User</b> and <b>Permit Sudo</b> options.'),
          options : [
            {label:'Yes', value: false },
            {label:'No', value: true },
          ],
          value: false
        },
        {
          type : 'select',
          name : 'shell',
          placeholder : T('Shell'),
          tooltip : T('Select the shell to use for local and SSH logins.'),
          options : [],
        },
        {
          type : 'checkbox',
          name : 'locked',
          placeholder : T('Lock User'),
          tooltip : T('Set to disable logging in to this user account.'),
          isHidden: false
        },
        {
          type : 'checkbox',
          name : 'sudo',
          placeholder : T('Permit Sudo'),
          tooltip : T('Give this user permission to use <a\
                      href="https://www.sudo.ws/"\
                      target="_blank">sudo</a>.'),
          isHidden: false
        },
        {
          type : 'checkbox',
          name : 'microsoft_account',
          placeholder : T('Microsoft Account'),
          tooltip : T('Set to allow additional username authentication\
                      methods when the user is connecting from a\
                      Windows 8 or newer operating system.'),
        },
      ]
    },
    {
      name:'divider',
      divider:true
    }
  ]





  private home: any;
  private mode: any;
  private shells: any;
  private shell: any;
  private group: any;
  private groups: any;
  private creategroup: any;
  private group_create: any;
  private password_disabled: any;
  private sudo: any;
  private locked: any;

  constructor(protected router: Router, protected rest: RestService,
              protected ws: WebSocketService, protected storageService: StorageService
              ) {}


   afterInit(entityForm: any) {
    this.entityForm = entityForm;
    this.isNew = entityForm.isNew;
    this.password_disabled = entityForm.formGroup.controls['password_disabled'];
    this.sudo = entityForm.formGroup.controls['sudo'];
    this.locked = entityForm.formGroup.controls['locked'];
    if (!entityForm.isNew) {
      _.find(this.fieldConfig, {name : "password_edit"}).isHidden = false;
      _.find(this.fieldConfig, {name : "password_conf_edit"}).isHidden = false;
      _.find(this.fieldConfig, {name : "password"}).isHidden = true;
      _.find(this.fieldConfig, {name : "password_conf"}).isHidden = true;
      this.password_disabled.valueChanges.subscribe((password_disabled)=>{
        if(password_disabled){
          _.find(this.fieldConfig, {name : "locked"}).isHidden = password_disabled;
          _.find(this.fieldConfig, {name : "sudo"}).isHidden = password_disabled;
          entityForm.setDisabled('password_edit', password_disabled);
          entityForm.setDisabled('password_conf_edit', password_disabled);
        } else{
          entityForm.formGroup.controls['sudo'].setValue(false);
          entityForm.formGroup.controls['locked'].setValue(false);
          _.find(this.fieldConfig, {name : "locked"}).isHidden = password_disabled;
          _.find(this.fieldConfig, {name : "sudo"}).isHidden = password_disabled;
          entityForm.setDisabled('password_edit', password_disabled);
          entityForm.setDisabled('password_conf_edit', password_disabled);
        };
      });

    } else {
      _.find(this.fieldConfig, {name : "password_edit"}).isHidden = true;
      _.find(this.fieldConfig, {name : "password_conf_edit"}).isHidden = true;
      _.find(this.fieldConfig, {name : "password"}).isHidden = false;
      _.find(this.fieldConfig, {name : "password_conf"}).isHidden = false;
      this.password_disabled.valueChanges.subscribe((password_disabled)=>{
        if(password_disabled){
          _.find(this.fieldConfig, {name : "locked"}).isHidden = password_disabled;
          _.find(this.fieldConfig, {name : "sudo"}).isHidden = password_disabled;
          entityForm.setDisabled('password', password_disabled);
          entityForm.setDisabled('password_conf', password_disabled);
        } else{
          entityForm.formGroup.controls['sudo'].setValue(false);
          entityForm.formGroup.controls['locked'].setValue(false);
          _.find(this.fieldConfig, {name : "locked"}).isHidden = password_disabled;
          _.find(this.fieldConfig, {name : "sudo"}).isHidden = password_disabled;
          entityForm.setDisabled('password', password_disabled);
          entityForm.setDisabled('password_conf', password_disabled);
        };
      });
    }


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
    const filter = [];
    filter.push("id");
    filter.push("=");
    filter.push(parseInt(entityForm.pk,10));
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
        _.find(this.fieldConfig, {name : "password"}).isHidden = true;
        _.find(this.fieldConfig, {name : "password_conf"}).isHidden = true;
        _.find(this.fieldConfig, {name : "password_edit"}).isHidden = false;
        _.find(this.fieldConfig, {name : "password_conf_edit"}).isHidden = false;
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
        this.ws.call('user.get_next_uid').subscribe((next_uid)=>{
          entityForm.formGroup.controls['uid'].setValue(next_uid);
        })
      }
      entityForm.ws.call('notifier.choices', [ 'SHELL_CHOICES' ]).subscribe((SHELL_CHOICES) => {
        this.shell = _.find(this.fieldConfig, {name : "shell"});
        this.shells = SHELL_CHOICES;
        SHELL_CHOICES.forEach((item) => {
        if (entityForm.isNew) {
          if(item[1] !== "netcli.sh"){
            this.shell.options.push({label : item[1], value : item[0]});
            entityForm.formGroup.controls['shell'].setValue(
            this.shells[1][0]);
          };
        }
        else {
          if(entityForm.data && !entityForm.data.bsdusr_builtin) {
            if(item[1] !== "netcli.sh"){
              this.shell.options.push({label : item[1], value : item[0]});
            }
          } else {
            this.shell.options.push({label : item[1], value : item[0]});
          } 
        } 
        });
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
    if(parent.entityForm) {
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
      }
    };
  }
  blurEvent2(parent){
    if(parent.entityForm) {
      const username = parent.entityForm.formGroup.controls.username.value;
      if(username.length > 8 ){
        _.find(parent.fieldConfig, { 'name': 'username' }).warnings= T('Usernames of 8 characters or less are recommended for compatibility with application software, but up to 16 characters are allowed.');
      } else {
        _.find(parent.fieldConfig, { 'name': 'username' }).warnings= null;


      };
    };
  }
}
