import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { helptext_system_ca } from 'app/helptext/system/ca';
import * as _ from 'lodash';
import { RestService, SystemGeneralService, WebSocketService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';



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
      placeholder : helptext_system_ca.add_name.placeholder,
      tooltip: helptext_system_ca.add_name.tooltip,
      required: true,
      validation : helptext_system_ca.add_name.validation,
      hasErrors: false,
      errors: 'Allowed characters: letters, numbers, underscore (_), and dash (-).'
    },
    {
      type : 'select',
      name : 'create_type',
      placeholder : helptext_system_ca.create_type.placeholder,
      options : [
        {label: 'Internal CA', value: 'CA_CREATE_INTERNAL'},
        {label: 'Intermediate CA', value: 'CA_CREATE_INTERMEDIATE'},
        {label: 'Import CA', value: 'CA_CREATE_IMPORTED'},
      ],
      value: 'CA_CREATE_INTERNAL',
    },
    {
      type : 'select',
      name : 'signedby',
      placeholder : helptext_system_ca.signedby.placeholder,
      tooltip: helptext_system_ca.signedby.tooltip,
      options : [
        {label: '---', value: null}
      ],
      isHidden: true,
      disabled: true,
      required: true,
      validation: helptext_system_ca.signedby.validation
    },
    {
      type : 'select',
      name : 'key_length',
      placeholder : helptext_system_ca.key_length.placeholder,
      tooltip: helptext_system_ca.key_length.tooltip,
      options : [
        {label : '1024', value : 1024},
        {label : '2048', value : 2048},
        {label : '4096', value : 4096},
      ],
      value: 2048,
      required: true,
      validation: helptext_system_ca.key_length.validation,
      isHidden: false,
    },
    {
      type : 'select',
      name : 'digest_algorithm',
      placeholder : helptext_system_ca.digest_algorithm.placeholder,
      tooltip: helptext_system_ca.digest_algorithm.tooltip,
      options : [
        {label : 'SHA1', value : 'SHA1'},
        {label : 'SHA224', value : 'SHA224'},
        {label : 'SHA256', value : 'SHA256'},
        {label : 'SHA384', value : 'SHA384'},
        {label : 'SHA512', value : 'SHA512'},
      ],
      value: 'SHA256',
      required: true,
      validation: helptext_system_ca.digest_algorithm.validation,
      isHidden: false,
    },
    {
      type : 'input',
      name : 'lifetime',
      placeholder : helptext_system_ca.lifetime.placeholder,
      tooltip: helptext_system_ca.lifetime.tooltip,
      inputType: 'number',
      required: true,
      value: 3650,
      validation: helptext_system_ca.lifetime.validation,
      isHidden: false,
    },
    {
      type : 'select',
      name : 'country',
      placeholder : helptext_system_ca.country.placeholder,
      tooltip: helptext_system_ca.country.tooltip,
      options : [
      ],
      value: 'US',
      required: true,
      validation: helptext_system_ca.country.validation,
      isHidden: false,
    },
    {
      type : 'input',
      name : 'state',
      placeholder : helptext_system_ca.state.placeholder,
      tooltip: helptext_system_ca.state.tooltip,
      required: true,
      validation: helptext_system_ca.state.validation,
      isHidden: false,
    },
    {
      type : 'input',
      name : 'city',
      placeholder : helptext_system_ca.city.placeholder,
      tooltip: helptext_system_ca.city.tooltip,
      required: true,
      validation: helptext_system_ca.city.validation,
      isHidden: false,
    },
    {
      type : 'input',
      name : 'organization',
      placeholder : helptext_system_ca.organization.placeholder,
      tooltip: helptext_system_ca.organization.tooltip,
      required: true,
      validation: helptext_system_ca.organization.validation,
      isHidden: false,
    },
    {
      type : 'input',
      name : 'email',
      placeholder : helptext_system_ca.email.placeholder,
      tooltip: helptext_system_ca.email.tooltip,
      required: true,
      validation : helptext_system_ca.email.validation,
      isHidden: false,
    },
    {
      type : 'input',
      name : 'common',
      placeholder : helptext_system_ca.common.placeholder,
      tooltip: helptext_system_ca.common.tooltip,
      required: true,
      validation : helptext_system_ca.common.validation,
      isHidden: false,
    },
    {
      type : 'textarea',
      name : 'san',
      placeholder: helptext_system_ca.san.placeholder,
      tooltip: helptext_system_ca.san.tooltip,
      isHidden: false,
    },
    {
      type : 'textarea',
      name : 'certificate',
      placeholder : helptext_system_ca.certificate.placeholder,
      tooltip : helptext_system_ca.certificate.tooltip,
      required: true,
      validation : helptext_system_ca.certificate.validation,
      isHidden: true,
    },
    {
      type : 'textarea',
      name : 'privatekey',
      placeholder : helptext_system_ca.privatekey.placeholder,
      tooltip : helptext_system_ca.privatekey.tooltip,
      isHidden: true,
    },
    {
      type : 'input',
      name : 'passphrase',
      placeholder : helptext_system_ca.passphrase.placeholder,
      tooltip : helptext_system_ca.passphrase.tooltip,
      inputType : 'password',
      validation : helptext_system_ca.passphrase.validation,
      isHidden: true,
      togglePw : true
    },
    {
      type : 'input',
      name : 'passphrase2',
      inputType : 'password',
      placeholder : helptext_system_ca.passphrase2.placeholder,
      isHidden : true
    },
  ];

  private internalcaFields: Array<any> = [
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
  private intermediatecaFields: Array<any> = [
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
  private importcaFields: Array<any> = [
    'certificate',
    'privatekey',
    'passphrase',
    'passphrase2',
  ];

  private country: any;
  private signedby: any;
  public identifier: any;

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
    for (let i in this.intermediatecaFields) {
      this.hideField(this.intermediatecaFields[i], true, entity);
    }
    for (let i in this.importcaFields) {
      this.hideField(this.importcaFields[i], true, entity);
    }
    for (let i in this.internalcaFields) {
      this.hideField(this.internalcaFields[i], false, entity);
    }

    entity.formGroup.controls['create_type'].valueChanges.subscribe((res) => {
      if (res == 'CA_CREATE_INTERNAL') {
        for (let i in this.intermediatecaFields) {
          this.hideField(this.intermediatecaFields[i], true, entity);
        }
        for (let i in this.importcaFields) {
          this.hideField(this.importcaFields[i], true, entity);
        }
        for (let i in this.internalcaFields) {
          this.hideField(this.internalcaFields[i], false, entity);
        }
      } else if (res == 'CA_CREATE_INTERMEDIATE') {
        for (let i in this.internalcaFields) {
          this.hideField(this.internalcaFields[i], true, entity);
        }
        for (let i in this.importcaFields) {
          this.hideField(this.importcaFields[i], true, entity);
        }
        for (let i in this.intermediatecaFields) {
          this.hideField(this.intermediatecaFields[i], false, entity);
        }
      } else if (res == 'CA_CREATE_IMPORTED') {
        for (let i in this.internalcaFields) {
          this.hideField(this.internalcaFields[i], true, entity);
        }
        for (let i in this.intermediatecaFields) {
          this.hideField(this.intermediatecaFields[i], true, entity);
        }
        for (let i in this.importcaFields) {
          this.hideField(this.importcaFields[i], false, entity);
        }
      }
    })

    entity.formGroup.controls['name'].valueChanges.subscribe((res) => {
      this.identifier = res;
    })

    entity.formGroup.controls['name'].statusChanges.subscribe((res) => {
      if (this.identifier && res === 'INVALID') {
        _.find(this.fieldConfig)['hasErrors'] = true;
      } else {
        _.find(this.fieldConfig)['hasErrors'] = false;
      }
    })

  }

  hideField(fieldName: any, show: boolean, entity: any) {
    let target = _.find(this.fieldConfig, {'name' : fieldName});
    target['isHidden'] = show;
    entity.setDisabled(fieldName, show);
  }

  beforeSubmit(data: any) {
    if (data.san == undefined || data.san == '') {
      data.san = [];
    } else {
      data.san = _.split(data.san, ' ');
    }

    // Addresses non-pristine field being mistaken for a passphrase of ''
    if (data.passphrase == '') {
      data.passphrase = undefined;
    }
    if (data.passphrase2) {
      delete data.passphrase2;
    }
  }
}
