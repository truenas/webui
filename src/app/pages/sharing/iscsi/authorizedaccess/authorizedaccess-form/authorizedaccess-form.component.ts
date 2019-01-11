import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { FieldConfig } from '../../../../common/entity/entity-form/models/field-config.interface';
import { AppLoaderService } from '../../../../../services/app-loader/app-loader.service';
import { EntityUtils } from '../../../../common/entity/utils';
import { WebSocketService } from '../../../../../services/ws.service';
import * as _ from 'lodash';
import { helptext_sharing_iscsi } from 'app/helptext/sharing';

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
      placeholder : helptext_sharing_iscsi.authaccess_placeholder_tag,
      tooltip: helptext_sharing_iscsi.authaccess_tooltip_tag,
      inputType : 'number',
      min: 0,
      required: true,
      validation : helptext_sharing_iscsi.authaccess_validators_tag 
    },
    {
      type : 'input',
      name : 'user',
      placeholder : helptext_sharing_iscsi.authaccess_placeholder_user,
      tooltip: helptext_sharing_iscsi.authaccess_tooltip_user,
      validation : helptext_sharing_iscsi.authaccess_validators_user,
      required: true,
    },
    {
      type : 'input',
      name : 'secret',
      placeholder : helptext_sharing_iscsi.authaccess_placeholder_secret,
      tooltip: helptext_sharing_iscsi.authaccess_tooltip_secret,
      inputType : 'password',
      togglePw: true,
      required: true,
      validation : helptext_sharing_iscsi.authaccess_validators_secret,
    },
    {
      type : 'input',
      name : 'secret_confirm',
      placeholder : helptext_sharing_iscsi.authaccess_placeholder_secret_confirm,
      inputType : 'password'
    },
    {
      type : 'input',
      name : 'peeruser',
      placeholder : helptext_sharing_iscsi.authaccess_placeholder_peeruser,
      tooltip: helptext_sharing_iscsi.authaccess_tooltip_peeruser,
    },
    {
      type : 'input',
      name : 'peersecret',
      placeholder : helptext_sharing_iscsi.authaccess_placeholder_peersecret,
      tooltip: helptext_sharing_iscsi.authaccess_tooltip_peersecret,
      inputType : 'password',
      togglePw: true,
      validation : helptext_sharing_iscsi.authaccess_validators_peersecret,
    },
    {
      type : 'input',
      name : 'peersecret_confirm',
      placeholder : helptext_sharing_iscsi.authaccess_placeholder_peersecret_confirm,
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
