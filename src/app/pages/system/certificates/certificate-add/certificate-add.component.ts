import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Validators } from '@angular/forms';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';

import { RestService, SystemGeneralService, WebSocketService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { T } from '../../../../translate-marker';
import { matchOtherValidator } from '../../../common/entity/entity-form/validators/password-validation';

@Component({
  selector : 'system-certificate-add',
  template : `<entity-form [conf]="this"></entity-form>`,
  providers : [ SystemGeneralService ]
})

export class CertificateAddComponent {

  protected addCall = "certificate.create";
  protected route_success: string[] = [ 'system', 'certificates' ];
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
        {label: 'Internal Certificate', value: 'CERTIFICATE_CREATE_INTERNAL'},
        {label: 'Certificate Signing Request', value: 'CERTIFICATE_CREATE_CSR'},
        {label: 'Import Certificate', value: 'CERTIFICATE_CREATE_IMPORTED'},
      ],
      value: 'CERTIFICATE_CREATE_INTERNAL',
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
      disabled: true,
      required: true,
      validation: [Validators.required]
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
      validation: [Validators.required],
      isHidden: false,
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
      validation: [Validators.required],
      isHidden: false,
    },
    {
      type : 'input',
      name : 'lifetime',
      placeholder : T('Lifetime'),
      tooltip: T('The lifetime of the CA is specified in days.'),
      inputType: 'number',
      required: true,
      value: 3650,
      validation: [Validators.required, Validators.min(0)],
      isHidden: false,
    },
    {
      type : 'select',
      name : 'country',
      placeholder : T('Country'),
      tooltip: T('Select the country for the organization.'),
      options : [
      ],
      value: 'US',
      required: true,
      validation: [Validators.required],
      isHidden: false,
    },
    {
      type : 'input',
      name : 'state',
      placeholder : T('State'),
      tooltip: T('Enter the state or province of the\
       organization.'),
      required: true,
      validation: [Validators.required],
      isHidden: false,
    },
    {
      type : 'input',
      name : 'city',
      placeholder : T('Locality'),
      tooltip: T('Enter the location of the organization.'),
      required: true,
      validation: [Validators.required],
      isHidden: false,
    },
    {
      type : 'input',
      name : 'organization',
      placeholder : T('Organization'),
      tooltip: T('Enter the name of the company or\
       organization.'),
      required: true,
      validation: [Validators.required],
      isHidden: false,
    },
    {
      type : 'input',
      name : 'email',
      placeholder : T('Email'),
      tooltip: T('Enter the email address for the person\
       responsible for the CA.'),
      required: true,
      validation : [ Validators.email, Validators.required ],
      isHidden: false,
    },
    {
      type : 'input',
      name : 'common',
      placeholder : T('Common Name'),
      tooltip: T('Enter the fully-qualified hostname (FQDN) of the\
       system. This name **must** be unique within a certificate\
       chain.'),
      required: true,
      validation : [ Validators.required ],
      isHidden: false,
    },
    {
      type : 'textarea',
      name : 'san',
      placeholder: T('Subject Alternate Names'),
      tooltip: T('Multi-domain support. Enter additional space separated domains.'),
      isHidden: false,
    },
    {
      type : 'textarea',
      name : 'certificate',
      placeholder : T('Certificate'),
      tooltip : T('Mandatory. Paste in the certificate for the CA.'),
      required: true,
      validation : [ Validators.required ],
      isHidden: true,
    },
    {
      type : 'textarea',
      name : 'privatekey',
      placeholder : T('Private Key'),
      tooltip : T('If there is a private key associated with the\
       <b>Certificate</b>, paste it here.'),
      isHidden: true,
    },
    {
      type : 'input',
      name : 'Passphrase',
      placeholder : T('Passphrase'),
      tooltip : T('If the <b>Private Key</b> is protected by a passphrase,\
       enter it here and repeat it in the "Confirm Passphrase" field.'),
      inputType : 'password',
      validation : [ matchOtherValidator('Passphrase2') ],
      isHidden: true,
    },
    {
      type : 'input',
      name : 'Passphrase2',
      inputType : 'password',
      placeholder : T('Confirm Passphrase'),
      isHidden: true,
    },
  ];

  private internalFields: Array<any> = [
    'signedby',
    'key_length',
    'digest_algorithm',
    'lifetime',
    'country',
    'state',
    'city',
    'organization',
    'email',
    'common',
    'san',
  ];
  private csrFields: Array<any> = [
    'key_length',
    'digest_algorithm',
    'country',
    'state',
    'city',
    'organization',
    'email',
    'common',
    'san',
  ];
  private importFields: Array<any> = [
    'certificate',
    'privatekey',
    'Passphrase',
    'Passphrase2',
  ];

  private country: any;
  private signedby: any;

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected systemGeneralService: SystemGeneralService) {}

  preInit() {
    this.systemGeneralService.getUnsignedCAs().subscribe((res) => {
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
    for (let i in this.csrFields) {
      this.hideField(this.csrFields[i], true, entity);
    }
    for (let i in this.importFields) {
      this.hideField(this.importFields[i], true, entity);
    }
    for (let i in this.internalFields) {
      this.hideField(this.internalFields[i], false, entity);
    }

    entity.formGroup.controls['create_type'].valueChanges.subscribe((res) => {
      if (res == 'CERTIFICATE_CREATE_INTERNAL') {
        for (let i in this.csrFields) {
          this.hideField(this.csrFields[i], true, entity);
        }
        for (let i in this.importFields) {
          this.hideField(this.importFields[i], true, entity);
        }
        for (let i in this.internalFields) {
          this.hideField(this.internalFields[i], false, entity);
        }
      } else if (res == 'CERTIFICATE_CREATE_CSR') {
        for (let i in this.internalFields) {
          this.hideField(this.internalFields[i], true, entity);
        }
        for (let i in this.importFields) {
          this.hideField(this.importFields[i], true, entity);
        }
        for (let i in this.csrFields) {
          this.hideField(this.csrFields[i], false, entity);
        }
      } else if (res == 'CERTIFICATE_CREATE_IMPORTED') {
        for (let i in this.internalFields) {
          this.hideField(this.internalFields[i], true, entity);
        }
        for (let i in this.csrFields) {
          this.hideField(this.csrFields[i], true, entity);
        }
        for (let i in this.importFields) {
          this.hideField(this.importFields[i], false, entity);
        }
      }
    })
  }

  hideField(fieldName: any, show: boolean, entity: any) {
    let target = _.find(this.fieldConfig, {'name' : fieldName});
    target.isHidden = show;
    entity.setDisabled(fieldName, show);
  }

  beforeSubmit(data: any) {
    if (data.san == undefined || data.san == '') {
      data.san = [];
    } else {
      data.san = _.split(data.san, ' ');
    }
  }
}
