import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Validators } from '@angular/forms';

import { FieldConfig } from '../../../../common/entity/entity-form/models/field-config.interface';
import { T } from '../../../../../translate-marker';
import { AppLoaderService } from '../../../../../services/app-loader/app-loader.service';
import { EntityUtils } from '../../../../common/entity/utils';
import { WebSocketService } from '../../../../../services/';

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
      placeholder : T('Initiators'),
      tooltip: T('Use <i>ALL</i> keyword or a list of initiator hostnames\
                  separated by spaces.'),
      value: '',
      inputType : 'textarea',
    },
    {
      type : 'input',
      name : 'auth_network',
      placeholder : T('Authorized Networks'),
      tooltip: T('Network addresses that can use this initiator. Use\
                  <i>ALL</i> or list network addresses with a\
                  <a href="https://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing"\
                  target="_blank">CIDR</a> mask. Separate multiple\
                  addresses with a space:\
                  <i>192.168.2.0/24 192.168.2.1/12</i>.'),
      value: '',
      inputType : 'textarea',
    },
    {
      type : 'input',
      name : 'comment',
      placeholder : T('Comment'),
      tooltip: T('Optional description.'),
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
