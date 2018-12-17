import { Component } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { FieldConfig } from '../../../../common/entity/entity-form/models/field-config.interface';
import { matchOtherValidator } from '../../../../common/entity/entity-form/validators/password-validation';
import { T } from '../../../../../translate-marker';
import { AppLoaderService } from '../../../../../services/app-loader/app-loader.service';
import { EntityUtils } from '../../../../common/entity/utils';
import { WebSocketService } from '../../../../../services/ws.service';
import * as _ from 'lodash';

@Component({
  selector : 'app-iscsi-authorizedaccess-form',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class AuthorizedAccessFormComponent {

  protected addCall: string = 'iscsi.auth.create';
  protected queryCall: string = 'iscsi.auth.query';
  protected editCall = 'iscsi.auth.update';
  // protected resource_name: string = 'services/iscsi/authcredential';
  protected route_success: string[] = [ 'sharing', 'iscsi', 'auth' ];
  protected isEntity: boolean = true;
  protected customFilter: Array<any> = [[["id", "="]]];

  protected fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'tag',
      placeholder : T('Group ID'),
      tooltip: T('Allows different groups to be configured\
                  with different authentication profiles.\
                  Example: all users with a group ID of\
                  <i>1</i> will inherit the authentication profile\
                  associated with Group <i>1</i>.'),
      inputType : 'number',
      min: 0,
      required: true,
      validation : [ Validators.required, Validators.min(0) ]
    },
    {
      type : 'input',
      name : 'user',
      placeholder : T('User'),
      tooltip: T('Enter name of user account to use\
                  for CHAP authentication with the user on the remote\
                  system. Many initiators\
                  default to the initiator name as the user.'),
      validation : [ Validators.required ],
      required: true,
    },
    {
      type : 'input',
      name : 'secret',
      placeholder : T('Secret'),
      tooltip: T('Enter a password for <b>User</b>.\
                  Must be between 12 and 16 characters.'),
      inputType : 'password',
      togglePw: true,
      required: true,
      validation : [
        Validators.minLength(12),
        Validators.maxLength(16),
        Validators.required,
        matchOtherValidator('secret_confirm'),
      ],
    },
    {
      type : 'input',
      name : 'secret_confirm',
      placeholder : T('Secret (Confirm)'),
      inputType : 'password'
    },
    {
      type : 'input',
      name : 'peeruser',
      placeholder : T('Peer User'),
      tooltip: T('Only input when configuring mutual CHAP.\
                  In most cases it will need to be the same value\
                  as <b>User</b>.'),
    },
    {
      type : 'input',
      name : 'peersecret',
      placeholder : T('Peer Secret'),
      tooltip: T('Enter the mutual secret password which\
                  <b>must be different than the <i>Secret</i></b>.\
                  Required if <b>Peer User</b> is set.'),
      inputType : 'password',
      togglePw: true,
      validation : [
        Validators.minLength(12),
        matchOtherValidator('peersecret_confirm'),
      ],
    },
    {
      type : 'input',
      name : 'peersecret_confirm',
      placeholder : T('Peer Secret (Confirm)'),
      inputType : 'password'
    },
  ];

  protected pk: any;
  protected entityForm: any;
  protected peeruser_field: any;
  protected peersecret_field: any;

  constructor(protected router: Router, protected aroute: ActivatedRoute, protected loader: AppLoaderService,
              protected ws: WebSocketService) {}

  preInit() {
    this.aroute.params.subscribe(params => {
      if (params['pk']) {
        this.pk = params['pk'];
        this.customFilter[0][0].push(parseInt(params['pk']));
      }
    });
  }

  beforeSubmit(value) {
    delete value['secret_confirm'];
    delete value['peersecret_confirm'];
  }

  customEditCall(value) {
    this.loader.open();
    this.ws.call(this.editCall, [this.pk, value]).subscribe(
      (res) => {
        this.loader.close();
        this.router.navigate(new Array('/').concat(this.route_success));
      },
      (res) => {
        this.loader.close();
        new EntityUtils().handleWSError(this.entityForm, res);
      }
    );

  }
}
