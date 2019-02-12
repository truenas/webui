import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { helptext_system_ca } from 'app/helptext/system/ca';
import * as _ from 'lodash';
import { RestService, SystemGeneralService, WebSocketService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';

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
      placeholder : helptext_system_ca.sign.ca_id.placeholder,
      isHidden: true,
    },
    {
      type : 'select',
      name : 'csr_cert_id',
      placeholder : helptext_system_ca.sign.csr_cert_id.placeholder,
      tooltip: helptext_system_ca.sign.csr_cert_id.tooltip,
      options : [
        {label: '-------', value: ''},
      ],
      value: '',
      required: true,
      validation: helptext_system_ca.sign.csr_cert_id.validation 
    },
    {
      type : 'input',
      name : 'name',
      placeholder : helptext_system_ca.sign.name.placeholder,
      tooltip: helptext_system_ca.sign.name.tooltip,
      required: true,
      validation: helptext_system_ca.sign.name.validation 
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
