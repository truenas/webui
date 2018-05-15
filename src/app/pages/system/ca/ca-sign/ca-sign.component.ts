import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Validators } from '@angular/forms';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';

import { RestService, WebSocketService, SystemGeneralService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { T } from '../../../../translate-marker';

@Component({
  selector : 'system-ca-add',
  template : `<entity-form [conf]="this"></entity-form>`,
  providers: [SystemGeneralService]
})

export class CertificateAuthoritySignComponent {

  protected addCall = "certificateauthority.ca_sign_csr";
  protected route_success: string[] = [ 'system', 'ca' ];
  protected isEntity: boolean = true;
  protected isNew: boolean = true;
  protected fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'ca_id',
      placeholder : T('CA ID'),
      isHidden: true,
    },
    {
      type : 'select',
      name : 'csr_cert_id',
      placeholder : T('CSRs'),
      options : [
        {label: '-------', value: ''},
      ],
      value: '',
      required: true,
      validation : [ Validators.required ]
    },
    {
      type : 'input',
      name : 'name',
      placeholder : T('Identifier'),
      required: true,
      validation : [ Validators.required ]
    }
  ];

  private unsignedCAs: any;
  private pk: any;

  constructor(protected router: Router, protected aroute: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected systemService: SystemGeneralService) {}

  preInit() {
    this.systemService.getUnsignedCertificates().subscribe( (res) => {
      this.unsignedCAs = _.find(this.fieldConfig, {'name' : 'csr_cert_id'});
      res.forEach((item) => {
        this.unsignedCAs.options.push(
          { label : item.name, value : parseInt(item.id)}
        );
      });
    });
    this.aroute.params.subscribe(params => {
      this.pk = params['pk'];
    });
  }

  beforeSubmit(data: any) {
    data.ca_id = parseInt(this.pk);
  }
}
