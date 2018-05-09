import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Validators } from '@angular/forms';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';

import { RestService, SystemGeneralService, WebSocketService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { T } from '../../../../translate-marker';

@Component({
  selector : 'system-ca-add',
  template : `<entity-form [conf]="this"></entity-form>`,
  providers : [ SystemGeneralService ]
})

export class CertificateAuthorityAddComponent {

  protected addCall = "certificateauthority.create";
  protected route_success: string[] = [ 'system', 'ca' ];
  protected isEntity: boolean = true;
  protected fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'name',
      placeholder : T('Identifier'),
      tooltip: T('Enter a descriptive name for the CA using\
       only alphanumeric, underscore (_), and dash (-) characters.'),
      required: true,
      validation : [ Validators.required ]
    },
    {
      type : 'select',
      name : 'create_type',
      placeholder : T('Type'),
      options : [
        {label: 'Internal CA', value: 'CA_CREATE_INTERNAL'},
        {label: 'Intermediate CA', value: 'CA_CREATE_INTERMEDIATE'},
      ],
      value: 'CA_CREATE_INTERNAL',
    },
    {
      type : 'select',
      name : 'signedby',
      placeholder : T('Signing Certificate Authority'),
      tooltip: T('Required; select the CA which was previously imported\
       or created using <a href="http://doc.freenas.org/11/system.html#cas" target="_blank">CAs</a>.'),
      options : [
        {label: '---', value: null}
      ],
      isHidden: true,
    },
    {
      type : 'select',
      name : 'key_length',
      placeholder : T('Key Length'),
      tooltip:T('For security reasons, a minimum of <i>2048</i>\
       is recommended.'),
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
      name : 'digest_algorithm',
      placeholder : T('Digest Algorithm'),
      tooltip: T('The default is acceptable unless your organization\
       requires a different algorithm.'),
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
      name : 'lifetime',
      placeholder : T('Lifetime'),
      tooltip: T('The lifetime of the CA is specified in days.'),
      inputType: 'number',
      required: true,
      value: 3650,
      validation: [Validators.required, Validators.min(0)]
    },
    {
      type : 'select',
      name : 'country',
      placeholder : T('Country'),
      tooltip: T('Select the country for the organization.'),
      options : [
      ],
      required: true,
      validation: [Validators.required]
    },
    {
      type : 'input',
      name : 'state',
      placeholder : T('State'),
      tooltip: T('Enter the state or province of the\
       organization.'),
      required: true,
      validation: [Validators.required]
    },
    {
      type : 'input',
      name : 'city',
      placeholder : T('Locality'),
      tooltip: T('Enter the location of the organization.'),
      required: true,
      validation: [Validators.required]
    },
    {
      type : 'input',
      name : 'organization',
      placeholder : T('Organization'),
      tooltip: T('Enter the name of the company or\
       organization.'),
      required: true,
      validation: [Validators.required]
    },
    {
      type : 'input',
      name : 'email',
      placeholder : T('Email'),
      tooltip: T('Enter the email address for the person\
       responsible for the CA.'),
      required: true,
      validation : [ Validators.email, Validators.required ]
    },
    {
      type : 'input',
      name : 'common',
      placeholder : T('Common Name'),
      tooltip: T('Enter the fully-qualified hostname (FQDN) of the\
       system. This name **must** be unique within a certificate\
       chain.'),
      required: true,
      validation : [ Validators.required ]
    },
    {
      type : 'textarea',
      name : 'san',
      placeholder: T('Subject Alternate Names'),
      tooltip: T('Multi-domain support. Enter additional space separated domains.')
    }
  ];

  private country: any;
  private signedby: any;

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected systemGeneralService: SystemGeneralService) {}

  preInit() {
    this.systemGeneralService.getCA().subscribe((res) => {
      this.signedby = _.find(this.fieldConfig, {'name' : 'signedby'});
      res.forEach((item) => {
        this.signedby.options.push(
            {label : item.name, value : item.id});
      });
    });

    this.ws.call('notifier.choices', ['COUNTRY_CHOICES']).subscribe( (res) => {
      this.country = _.find(this.fieldConfig, {'name' : 'country'});
      res.forEach((item) => {
        this.country.options.push(
          { label : item[1], value : item[0]}
        );
      });
    });
  }

  afterInit(entity: any) {

    entity.formGroup.controls['create_type'].valueChanges.subscribe((res) => {
      if (res == 'CA_CREATE_INTERNAL') {
        this.signedby.isHidden = true;
      } else if (res == 'CA_CREATE_INTERMEDIATE') {
        this.signedby.isHidden = false;
      }
    })
  }

  beforeSubmit(data: any) {
    if (data.san == undefined || data.san == '') {
      data.san = [];
    } else {
      data.san = _.split(data.san, ' ');
    }
  }
}
