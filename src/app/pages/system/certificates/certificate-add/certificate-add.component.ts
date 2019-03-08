import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { RestService, SystemGeneralService, WebSocketService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { matchOtherValidator } from '../../../common/entity/entity-form/validators/password-validation';
import { helptext_system_certificates } from 'app/helptext/system/certificates';

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
      placeholder : helptext_system_certificates.add.name.placeholder,
      tooltip: helptext_system_certificates.add.name.tooltip,
      required: true,
      validation : helptext_system_certificates.add.name.validation,
      hasErrors: false,
      errors: 'Allowed characters: letters, numbers, underscore (_), and dash (-).'
    },
    {
      type : 'select',
      name : 'create_type',
      placeholder : helptext_system_certificates.add.create_type.placeholder,
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
      placeholder : helptext_system_certificates.add.signedby.placeholder,
      tooltip: helptext_system_certificates.add.signedby.tooltip,
      options : [
        {label: '---', value: null}
      ],
      isHidden: true,
      disabled: true,
      required: true,
      validation: helptext_system_certificates.add.signedby.validation
    },
    {
      type : 'select',
      name : 'key_type',
      placeholder : helptext_system_certificates.add.key_type.placeholder,
      tooltip: helptext_system_certificates.add.key_type.tooltip,
      options : [
        {label: 'RSA', value: 'RSA'},
        {label: 'EC', value: 'EC'},
      ],
      value: 'RSA',
      isHidden: false,
      disabled: true,
      required: true,
      validation: helptext_system_certificates.add.key_type.validation
    },
    {
      type : 'select',
      name : 'ec_curve',
      placeholder : helptext_system_certificates.add.ec_curve.placeholder,
      tooltip: helptext_system_certificates.add.ec_curve.tooltip,
      options : [
        {label: 'BrainpoolP512R1', value: 'BRAINPOOLP512R1'},
        {label: 'BrainpoolP384R1', value: 'BRAINPOOLP384R1'},
        {label: 'BrainpoolP256R1', value: 'BRAINPOOLP256R1'},
        {label: 'SECP256K1', value: 'SECP256K1'},
      ],
      value: 'BRAINPOOLP512R1',
      isHidden: true,
      disabled: true,
      relation : [
        {
          action : 'ENABLE',
          when : [ {
            name : 'key_type',
            value : 'EC',
          } ]
        },
      ]
    },
    {
      type : 'select',
      name : 'key_length',
      placeholder : helptext_system_certificates.add.key_length.placeholder,
      tooltip: helptext_system_certificates.add.key_length.tooltip,
      options : [
        {label : '1024', value : 1024},
        {label : '2048', value : 2048},
        {label : '4096', value : 4096},
      ],
      value: 2048,
      required: true,
      validation: helptext_system_certificates.add.key_length.validation,
      isHidden: false,
    },
    {
      type : 'select',
      name : 'digest_algorithm',
      placeholder : helptext_system_certificates.add.digest_algorithm.placeholder,
      tooltip: helptext_system_certificates.add.digest_algorithm.tooltip,
      options : [
        {label : 'SHA1', value : 'SHA1'},
        {label : 'SHA224', value : 'SHA224'},
        {label : 'SHA256', value : 'SHA256'},
        {label : 'SHA384', value : 'SHA384'},
        {label : 'SHA512', value : 'SHA512'},
      ],
      value: 'SHA256',
      required: true,
      validation: helptext_system_certificates.add.digest_algorithm.validation,
      isHidden: false,
    },
    {
      type : 'input',
      name : 'lifetime',
      placeholder : helptext_system_certificates.add.lifetime.placeholder,
      tooltip: helptext_system_certificates.add.lifetime.tooltip,
      inputType: 'number',
      required: true,
      value: 3650,
      validation: helptext_system_certificates.add.lifetime.validation,
      isHidden: false,
    },
    {
      type : 'select',
      name : 'country',
      placeholder : helptext_system_certificates.add.country.placeholder,
      tooltip: helptext_system_certificates.add.country.tooltip,
      options : [
      ],
      value: 'US',
      required: true,
      validation: helptext_system_certificates.add.country.validation,
      isHidden: false,
    },
    {
      type : 'input',
      name : 'state',
      placeholder : helptext_system_certificates.add.state.placeholder,
      tooltip: helptext_system_certificates.add.state.tooltip,
      required: true,
      validation: helptext_system_certificates.add.state.validation,
      isHidden: false,
    },
    {
      type : 'input',
      name : 'city',
      placeholder : helptext_system_certificates.add.city.placeholder,
      tooltip: helptext_system_certificates.add.city.tooltip,
      required: true,
      validation: helptext_system_certificates.add.city.validation,
      isHidden: false,
    },
    {
      type : 'input',
      name : 'organization',
      placeholder : helptext_system_certificates.add.organization.placeholder,
      tooltip: helptext_system_certificates.add.organization.tooltip,
      required: true,
      validation: helptext_system_certificates.add.organization.validation,
      isHidden: false,
    },
    {
      type : 'input',
      name : 'organizational_unit',
      placeholder : helptext_system_certificates.add.organizational_unit.placeholder,
      tooltip: helptext_system_certificates.add.organizational_unit.tooltip,
      required: false,
      isHidden: false,
    },
    {
      type : 'input',
      name : 'email',
      placeholder : helptext_system_certificates.add.email.placeholder,
      tooltip: helptext_system_certificates.add.email.tooltip,
      required: true,
      validation : helptext_system_certificates.add.email.validation,
      isHidden: false,
    },
    {
      type : 'input',
      name : 'common',
      placeholder : helptext_system_certificates.add.common.placeholder,
      tooltip: helptext_system_certificates.add.common.tooltip,
      required: true,
      validation : helptext_system_certificates.add.common.validation,
      isHidden: false,
    },
    {
      type : 'textarea',
      name : 'san',
      placeholder: helptext_system_certificates.add.san.placeholder,
      tooltip: helptext_system_certificates.add.san.tooltip,
      isHidden: false,
    },
    {
      type : 'textarea',
      name : 'certificate',
      placeholder : helptext_system_certificates.add.certificate.placeholder,
      tooltip : helptext_system_certificates.add.certificate.tooltip,
      required: true,
      validation : helptext_system_certificates.add.certificate.validation,
      isHidden: true,
    },
    {
      type : 'textarea',
      name : 'privatekey',
      placeholder : helptext_system_certificates.add.privatekey.placeholder,
      tooltip : helptext_system_certificates.add.privatekey.tooltip,
      isHidden: true,
    },
    {
      type : 'input',
      name : 'passphrase',
      placeholder : helptext_system_certificates.add.passphrase.placeholder,
      tooltip : helptext_system_certificates.add.passphrase.tooltip,
      inputType : 'password',
      validation : helptext_system_certificates.add.passphrase.validation,
      isHidden: true,
      togglePw : true
    },
    {
      type : 'input',
      name : 'passphrase2',
      inputType : 'password',
      placeholder : helptext_system_certificates.add.passphrase2.placeholder,
      isHidden : true
    },
  ];

  private internalFields: Array<any> = [
    'signedby',
    'key_type',
    'ec_curve',
    'key_length',
    'digest_algorithm',
    'lifetime',
    'country',
    'state',
    'city',
    'organization',
    'organizational_unit',
    'email',
    'common',
    'san',
  ];
  private csrFields: Array<any> = [
    'key_type',
    'key_length',
    'ec_curve',
    'digest_algorithm',
    'country',
    'state',
    'city',
    'organization',
    'organizational_unit',
    'email',
    'common',
    'san',
  ];
  private importFields: Array<any> = [
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
      data.san = _.split(data.san, /\s/);
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
