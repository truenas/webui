import {
  ApplicationRef,
  Component,
  Injector,
  OnInit,
  ViewContainerRef
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormGroup,
  Validators
} from '@angular/forms';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';

import {RestService, WebSocketService} from '../../../../services/';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector : 'system-certificate-csr',
  template : `<entity-form [conf]="this"></entity-form>`
})

export class CertificateCSRComponent {

  protected resource_name: string = 'system/certificate/csr';
  protected route_success: string[] = [ 'system', 'certificates' ];
  protected isEntity: boolean = true;
  protected fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'cert_name',
      placeholder : 'Identifier',
      tooltip: 'Enter a descriptive name for the certificate using\
 only alphanumeric, underscore (_), and dash (-) characters.',
    },
    {
      type : 'select',
      name : 'cert_key_length',
      placeholder : 'Key Length',
      tooltip: 'For security reasons, a minimum of\
 <i>2048</i> is recommended.',
      options : [
        {label : '1024', value : 1024},
        {label : '2048', value : 2048},
        {label : '4096', value : 4096},
      ],
    },
    {
      type : 'select',
      name : 'cert_digest_algorithm',
      placeholder : 'Digest Algorithm',
       tooltip: 'The default is acceptable unless the organization\
 requires a different algorithm.',
      options : [
        {label : 'SHA1', value : 'SHA1'},
        {label : 'SHA224', value : 'SHA224'},
        {label : 'SHA256', value : 'SHA256'},
        {label : 'SHA384', value : 'SHA384'},
        {label : 'SHA512', value : 'SHA512'},
      ],
    },
    {
      type : 'select',
      name : 'cert_country',
      placeholder : 'Country',
      tooltip: 'Select the country for the organization.',
      options : [],
    },
    {
      type : 'input',
      name : 'cert_state',
      placeholder : 'State',
      tooltip: 'Enter the State or Province name\
 (for example, California).',
    },
    {
      type : 'input',
      name : 'cert_city',
      placeholder : 'Locality',
      tooltip: 'Enter the location of the organization\
 (for example, city or town).',
    },
    {
      type : 'input',
      name : 'cert_organization',
      placeholder : 'Organization',
      tooltip: 'Enter the name of the organization\
 (for example, company name).',
    },
    {
      type : 'input',
      name : 'cert_email',
      placeholder : 'Email',
      tooltip:'Enter the email address of\
 the person responsible for the CA.',
      validation : [ Validators.email ]
    },
    {
      type : 'input',
      name : 'cert_common',
      placeholder : 'Common Name',
      tooltip: 'Enter the fully-qualified\
 hostname (FQDN) of the FreeNAS® system.',
    },
    {
      type : 'textarea',
      name : 'cert_san',
      placeholder: 'Subject Alternate Names',
      tooltip: 'Multi-domain support. Enter additional space separated domains.'
    }
  ];
  private cert_country: any;

  afterInit(entityEdit: any) {
    this.ws.call('notifier.choices', ['COUNTRY_CHOICES']).subscribe( (res) => {
      // console.log(res);
      this.cert_country = _.find(this.fieldConfig, {'name' : 'cert_country'});
      res.forEach((item) => {
        this.cert_country.options.push(
          { label : item[1], value : item[0]}
        );
      });
    });
  }

  constructor(
      protected router: Router,
      protected route: ActivatedRoute,
      protected rest: RestService,
      protected ws: WebSocketService,
      protected _injector: Injector,
      protected _appRef: ApplicationRef
  ) {}
}
