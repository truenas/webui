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

import {
  RestService,
  SystemGeneralService,
  WebSocketService
} from '../../../../services/';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';
import { T } from '../../../../translate-marker';

@Component({
  selector : 'system-certificate-internal',
  template : `<entity-form [conf]="this"></entity-form>`,
  providers : [ SystemGeneralService ]
})

export class CertificateInternalComponent {

  protected resource_name: string = 'system/certificate/internal';
  protected route_success: string[] = [ 'system', 'certificates' ];
  protected isEntity: boolean = true;
  protected fieldConfig: FieldConfig[] = [
    {
      type : 'select',
      name : 'cert_signedby',
      placeholder : T('Signing Certificate Authority'),
      tooltip: T('Select a previously imported CA or a CA created using\
                  <a href="system/ca" target="_blank">CAs</a>.'),
      options : [
        {label: '---', value: null}
      ],
      required: true,
      validation: [Validators.required]
    },
    {
      type : 'input',
      name : 'cert_name',
      placeholder : T('Identifier'),
      tooltip: T('Enter a descriptive name for the certificate using\
                  only alphanumeric, underscore (_), and dash (-)\
                  characters.'),
      required: true,
      validation : [ Validators.required ]
    },
    {
      type : 'select',
      name : 'cert_key_length',
      placeholder : T('Key Length'),
      tooltip: T('<i>2048</i> is the recommended minimum value.'),
      options : [
        {label : '1024', value : 1024},
        {label : '2048', value : 2048},
        {label : '4096', value : 4096},
      ],
      value: 2048,
      required: true,
      validation: [Validators.required]
    },
    {
      type : 'select',
      name : 'cert_digest_algorithm',
      placeholder : T('Digest Algorithm'),
      tooltip: T('Use the default value unless a different algorithm is\
                  required.'),
      options : [
        {label : 'SHA1', value : 'SHA1'},
        {label : 'SHA224', value : 'SHA224'},
        {label : 'SHA256', value : 'SHA256'},
        {label : 'SHA384', value : 'SHA384'},
        {label : 'SHA512', value : 'SHA512'},
      ],
      value: 'SHA256',
      required: true,
      validation: [Validators.required]
    },
    {
      type : 'input',
      name : 'cert_lifetime',
      placeholder : T('Lifetime'),
      tooltip: T('Define the lifetime of the certificate in days.'),
      inputType: 'number',
      required: true,
      value: 3650,
      validation: [Validators.required, Validators.min(0)]
    },
    {
      type : 'select',
      name : 'cert_country',
      placeholder : T('Country'),
      tooltip: T('Associate a country with the <b>Organization</b>.'),
      options : [],
      required: true,
      validation: [Validators.required]
    },
    {
      type : 'input',
      name : 'cert_state',
      placeholder : T('State'),
      tooltip: T('The state or province of the <b>Organization</b>.'),
      required: true,
      validation: [Validators.required]
    },
    {
      type : 'input',
      name : 'cert_city',
      placeholder : T('Locality'),
      tooltip: T('The specific location of the <b>Organization</b>.'),
      required: true,
      validation: [Validators.required]
    },
    {
      type : 'input',
      name : 'cert_organization',
      placeholder : 'Organization',
      tooltip: 'Enter the name of the entity controlling this certificate.',
      required: true,
      validation: [Validators.required]
    },
    {
      type : 'input',
      name : 'cert_email',
      placeholder : 'Email',
      tooltip:'Enter an email address for the person responsible for\
               the CA.',
      required: true,
      validation : [ Validators.email, Validators.required ]
    },
    {
      type : 'input',
      name : 'cert_common',
      placeholder : T('Common Name'),
      tooltip: T('Enter the fully-qualified hostname (FQDN) of the\
                  system. This name must be unique within a\
                  certificate chain.'),
      required: true,
      validation: [Validators.required]
    },
    {
      type : 'textarea',
      name : 'cert_san',
      placeholder: T('Subject Alternate Names'),
      tooltip: T('Enter additional space-separated domains to enable\
                  multi-domain support.')
    }
  ];
  private cert_signedby: any;
  private cert_country: any;

  afterInit(entityEdit: any) {
    this.systemGeneralService.getCA().subscribe((res) => {
      this.cert_signedby = _.find(this.fieldConfig, {'name' : 'cert_signedby'});
      res.forEach((item) => {
        this.cert_signedby.options.push(
            {label : item.cert_name, value : item.id});
      });
    });
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

  ngOnInit() {}

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              protected systemGeneralService: SystemGeneralService) {}
}
