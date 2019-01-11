import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { FieldConfig } from '../../../../common/entity/entity-form/models/field-config.interface';
import { AppLoaderService } from '../../../../../services/app-loader/app-loader.service';
import { EntityUtils } from '../../../../common/entity/utils';
import { WebSocketService } from '../../../../../services/';
import { helptext_sharing_iscsi } from 'app/helptext/sharing';

@Component({
  selector : 'app-iscsi-initiator-form',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class InitiatorFormComponent {

  protected addCall: string = 'iscsi.initiator.create';
  protected queryCall: string = 'iscsi.initiator.query';
  protected editCall = 'iscsi.initiator.update';
  protected customFilter: Array<any> = [[["id", "="]]];
  protected route_success: string[] = [ 'sharing', 'iscsi', 'initiator' ];
  protected isEntity: boolean = true;
  protected pk: any;
  protected entityForm: any;

  protected fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'initiators',
      placeholder : helptext_sharing_iscsi.initiator_form_placeholder_initiators,
      tooltip: helptext_sharing_iscsi.initiator_form_tooltip_initiators,
      value: '',
      inputType : 'textarea',
    },
    {
      type : 'input',
      name : 'auth_network',
      placeholder : helptext_sharing_iscsi.initiator_form_placeholder_auth_network,
      tooltip: helptext_sharing_iscsi.initiator_form_tooltip_auth_network,
      value: '',
      inputType : 'textarea',
    },
    {
      type : 'input',
      name : 'comment',
      placeholder : helptext_sharing_iscsi.initiator_form_placeholder_comment,
      tooltip: helptext_sharing_iscsi.initiator_form_tooltip_comment,
    },
  ];

  constructor(protected router: Router, protected aroute: ActivatedRoute, protected loader: AppLoaderService, protected ws: WebSocketService) {}

  preInit() {
    this.aroute.params.subscribe(params => {
      if (params['pk']) {
        this.pk = params['pk'];
        this.customFilter[0][0].push(parseInt(params['pk']));
      }
    });
  }

  afterInit(entityForm) {
    this.entityForm = entityForm;
  }

  resourceTransformIncomingRestData(data) {
    data['initiators'] = data['initiators'].join(' ');
    data['auth_network'] = data['auth_network'].join(' ');
    return data;
  }

  beforeSubmit(data) {
    data.initiators = data.initiators.split(' ');
    data.auth_network = data.auth_network.split(' ');
  }

  customEditCall(value) {
    this.loader.open();
    this.ws.call(this.editCall, [this.pk, value]).subscribe(
      (res) => {
        this.loader.close();
        this.router.navigate(new Array('/').concat(this.route_success));
      },
      (err) => {
        this.loader.close();
        new EntityUtils().handleWSError(this.entityForm, err);
      }
    );
  }
}
