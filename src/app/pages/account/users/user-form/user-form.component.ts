import {Placeholder} from '@angular/compiler/src/i18n/i18n_ast';
import {Component} from '@angular/core';
import {Router} from '@angular/router';
import * as _ from 'lodash';

import { T } from '../../../../translate-marker';
import {
  NetworkService,
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
          name : 'username',
          placeholder : T('Username'),
          tooltip : T('Enter an alphanumeric username of 8 characters\
                      or less. Usernames cannot begin with a hyphen\
                      (<b>-</b>) or contain a space, tab, or these\
                      characters: <b>, : + & # %^ ( ) ! @ ~ * ? < > =</b>\
                      . A <b>$</b> can only be used as the last\
                      character.'),
          required: true,
          validation : [ Validators.required ]
        },
        {
          type : 'input',
          name : 'full_name',
          placeholder : T('Full Name'),
          tooltip : T('Spaces are allowed.'),
          required: true,
          validation : [ Validators.required ]
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
        },
        {
          type : 'input',
          name : 'password_conf',
          placeholder : T('Confirm Password'),
          inputType : 'password',
          validation : [ matchOtherValidator('password') ],
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
  ];
  public custActions: Array<any> = [
    {
      id : 'register_authenticator',
      name : T('Register Authenticator'),
      function : () => {this.registerAuthenticator();}
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
  private password_disabled: any;
  private sudo: any;
  private locked: any;
  private entityForm: any;

  constructor(protected router: Router, protected rest: RestService,
              protected ws: WebSocketService, protected storageService: StorageService,
              private dialog:DialogService, private cdRef:ChangeDetectorRef ) {}


  afterInit(entityForm: any) {
    this.isNew = entityForm.isNew;
    this.password_disabled = entityForm.formGroup.controls['password_disabled'];
    this.sudo = entityForm.formGroup.controls['sudo'];
    this.locked = entityForm.formGroup.controls['locked'];

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
      }
    })


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
    });
    /* list shells */
    entityForm.ws.call('notifier.choices', [ 'SHELL_CHOICES' ])
        .subscribe((res) => {
          this.shell = _.find(this.fieldConfig, {name : "shell"});
          this.shells = res;
          const bsduser_shell = this.shell
          res.forEach((item) => {
            this.shell.options.push({label : item[1], value : item[0]});
          });
          entityForm.formGroup.controls['shell'].setValue(
              this.shells[1][0]);
        });
    if (!entityForm.isNew){
      entityForm.submitFunction = this.submitFunction;
    }

    this.entityForm = entityForm;
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

    }
  }
  submitFunction(this: any, entityForm: any, ){
    delete entityForm['uid']
    delete entityForm['group_create']
    delete entityForm['password_conf']
    return this.ws.call('user.update', [this.pk, entityForm]);
  }

  registerAuthenticator(){
    console.log("REGISTERING AUTHENTICATOR");
    let entityForm = this.entityForm;
    this.ws.call('user.authenticator_challenge', [entityForm.pk]).subscribe(
      (createData) => {
        var cancelled = false;
        console.log(createData);
        createData.user.id = new Uint8Array(createData.user.id);
        createData.challenge = new Uint8Array(createData.challenge);
        var dialog = this.dialog.Operation(
          'Register Authenticator',
          'Please touch the blinking authenticator...',
        );
        dialog.afterClosed().subscribe(() => { cancelled = true; });
        console.log(dialog);
        navigator.credentials.create({publicKey: createData}).then(
          (attestation) => {
            if (cancelled) {
              return;
            }

            console.log(cancelled);
            console.log(attestation);
            dialog.close();

            console.log(this);
            this.ws.call('user.authenticator_register', [
              entityForm.pk,
              Array.from(new Uint8Array(attestation.response.attestationObject)),
              Array.from(new Uint8Array(attestation.response.clientDataJSON))
            ]).subscribe(
              (succeeded) => {
                console.log(succeeded);
                if (succeeded) {
                  this.dialog.Info(
                    'Register Authenticator',
                    'Authenticator successfully registered.');
                } else {
                  this.dialog.Info(
                    'Register Authenticator',
                    'Authenticator registration failed.');
                }
              }
            );
          }
        ).catch(
          (err) => {
            console.log(err);
          }
        );
      }
    );
  }
}
