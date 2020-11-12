import { Component } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Wizard } from '../../../common/entity/entity-form/models/wizard.interface';
import { EntityWizardComponent } from '../../../common/entity/entity-wizard/entity-wizard.component';
import * as _ from 'lodash';
import { SystemGeneralService, WebSocketService } from '../../../../services/';
import { ModalService } from 'app/services/modal.service';
import { EntityJobComponent } from '../../../common/entity/entity-job/entity-job.component';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from '../../../common/entity/entity-form/models/fieldset.interface';
import { EntityUtils } from '../../../common/entity/utils';
import { helptext_system_certificates } from 'app/helptext/system/certificates';
import { helptext_system_ca } from 'app/helptext/system/ca';

@Component({
  selector : 'system-certificate-add',
  template : `<entity-wizard [conf]="this"></entity-wizard>`,
  providers : [ SystemGeneralService ]
})

export class CertificateAddComponent {

  protected addCall = "certificate.create";
  protected isEntity: boolean = true;
  protected dialogRef: any;
  private entityWizard: any;
  private title: string;
  private CSRList = [];

  protected wizardConfig: Wizard[] = [{
    label: 'Identifier and Type',
    fieldConfig: [
      {
        type: 'input',
        name: 'name',
        placeholder: helptext_system_certificates.add.name.placeholder,
        tooltip: helptext_system_certificates.add.name.tooltip,
        required: true,
        validation: helptext_system_certificates.add.name.validation,
        hasErrors: false,
        errors: helptext_system_certificates.add.name.errors,
      },
      {
        type: 'select',
        name: 'create_type',
        tooltip: helptext_system_certificates.add.create_type.tooltip,
        placeholder: helptext_system_certificates.add.create_type.placeholder,
        options: [
          { label: 'Internal Certificate', value: 'CERTIFICATE_CREATE_INTERNAL' },
          { label: 'Import Certificate', value: 'CERTIFICATE_CREATE_IMPORTED' },
        ],
        value: 'CERTIFICATE_CREATE_INTERNAL',
      },
      {
        type: 'select',
        name: 'profiles',
        placeholder: helptext_system_certificates.add.profiles.placeholder,
        tooltip: helptext_system_certificates.add.profiles.tooltip,
        options: [{
          label: '---------',
          value: {},
        }],
        relation: [
          {
            action: 'HIDE',
            when: [{
              name: 'create_type',
              value: 'CERTIFICATE_CREATE_IMPORTED',
            }]
          },
        ]
      }
    ]}, {
    label: 'Certificate Options',
    fieldConfig: [
      {
        type: 'checkbox',
        name: 'csronsys',
        placeholder: helptext_system_certificates.add.isCSRonSystem.placeholder,
        tooltip: helptext_system_certificates.add.isCSRonSystem.tooltip,
        isHidden: true,
        disabled: true,
      },
      {
        type: 'select',
        name: 'csrlist',
        placeholder: helptext_system_certificates.add.signedby.placeholder,
        tooltip: helptext_system_certificates.add.signedby.tooltip,
        options: [
          { label: '---', value: null }
        ],
        isHidden: true,
        disabled: true,
        required: true,
        validation: helptext_system_certificates.add.signedby.validation,
        relation: [
          {
            action: 'ENABLE',
            when: [{
              name: 'csronsys',
              value: true,
            }]
          },
        ]
      },
      {
        type: 'select',
        name: 'signedby',
        placeholder: helptext_system_certificates.add.signedby.placeholder,
        tooltip: helptext_system_certificates.add.signedby.tooltip,
        options: [
          { label: '---', value: null }
        ],
        isHidden: true,
        disabled: true,
        required: true,
        validation: helptext_system_certificates.add.signedby.validation,
      },
      {
        type: 'select',
        name: 'key_type',
        placeholder: helptext_system_certificates.add.key_type.placeholder,
        tooltip: helptext_system_ca.add.key_type.tooltip,
        options: [
          { label: 'RSA', value: 'RSA' },
          { label: 'EC', value: 'EC' }
        ],
        value: 'RSA',
        isHidden: false,
        disabled: true,
        required: true,
        validation: helptext_system_certificates.add.key_type.validation
      },
      {
        type: 'select',
        name: 'ec_curve',
        placeholder: helptext_system_certificates.add.ec_curve.placeholder,
        tooltip: helptext_system_ca.add.ec_curve.tooltip,
        options: [],
        value: 'BrainpoolP384R1',
        isHidden: true,
        disabled: true,
        relation: [
          {
            action: 'SHOW',
            when: [{
              name: 'key_type',
              value: 'EC',
            }]
          },
        ]
      },
      {
        type: 'select',
        name: 'key_length',
        placeholder: helptext_system_certificates.add.key_length.placeholder,
        tooltip: helptext_system_certificates.add.key_length.tooltip,
        options: [
          { label: '1024', value: 1024 },
          { label: '2048', value: 2048 },
          { label: '4096', value: 4096 },
        ],
        value: 2048,
        required: true,
        validation: helptext_system_certificates.add.key_length.validation,
        isHidden: false,
        relation: [
          {
            action: 'SHOW',
            when: [{
              name: 'key_type',
              value: 'RSA',
            }]
          },
        ]
      },
      {
        type: 'select',
        name: 'digest_algorithm',
        placeholder: helptext_system_certificates.add.digest_algorithm.placeholder,
        tooltip: helptext_system_certificates.add.digest_algorithm.tooltip,
        options: [
          { label: 'SHA1', value: 'SHA1' },
          { label: 'SHA224', value: 'SHA224' },
          { label: 'SHA256', value: 'SHA256' },
          { label: 'SHA384', value: 'SHA384' },
          { label: 'SHA512', value: 'SHA512' },
        ],
        value: 'SHA256',
        required: true,
        validation: helptext_system_certificates.add.digest_algorithm.validation,
        isHidden: false,
      },
      {
        type: 'input',
        name: 'lifetime',
        placeholder: helptext_system_certificates.add.lifetime.placeholder,
        tooltip: helptext_system_certificates.add.lifetime.tooltip,
        inputType: 'number',
        required: true,
        value: 3650,
        validation: helptext_system_certificates.add.lifetime.validation,
        isHidden: false,
      },
      {
        type: 'textarea',
        name: 'certificate',
        placeholder: helptext_system_certificates.add.certificate.placeholder,
        tooltip: helptext_system_certificates.add.certificate.tooltip,
        required: true,
        validation: helptext_system_certificates.add.certificate.validation,
        isHidden: true,
      },
      {
        type: 'textarea',
        name: 'privatekey',
        placeholder: helptext_system_certificates.add.privatekey.placeholder,
        tooltip: helptext_system_certificates.add.privatekey.tooltip,
        isHidden: true,
        relation: [
          {
            action: 'DISABLE',
            when: [{
              name: 'csronsys',
              value: true,
            }]
          },
        ]
      },
      {
        type: 'input',
        name: 'passphrase',
        placeholder: helptext_system_certificates.add.passphrase.placeholder,
        tooltip: helptext_system_certificates.add.passphrase.tooltip,
        inputType: 'password',
        validation: helptext_system_certificates.add.passphrase.validation,
        isHidden: true,
        togglePw: true,
        relation: [
          {
            action: 'DISABLE',
            when: [{
              name: 'csronsys',
              value: true,
            }]
          },
        ]
      },
      {
        type: 'input',
        name: 'passphrase2',
        inputType: 'password',
        placeholder: helptext_system_certificates.add.passphrase2.placeholder,
        isHidden: true,
        relation: [
          {
            action: 'DISABLE',
            when: [{
              name: 'csronsys',
              value: true,
            }]
          },
        ]
      }
    ]},
    {
      label: 'Subject',
      fieldConfig: [
        {
          type: 'select',
          name: 'country',
          placeholder: helptext_system_certificates.add.country.placeholder,
          tooltip: helptext_system_certificates.add.country.tooltip,
          options: [
          ],
          value: 'US',
          required: true,
          validation: helptext_system_certificates.add.country.validation,
          isHidden: false,
          class: 'inline',
          width: '50%',
        },
        {
          type: 'input',
          name: 'state',
          placeholder: helptext_system_certificates.add.state.placeholder,
          tooltip: helptext_system_certificates.add.state.tooltip,
          required: true,
          validation: helptext_system_certificates.add.state.validation,
          isHidden: false,
          class: 'inline',
          width: '50%',
        },
        {
          type: 'input',
          name: 'city',
          placeholder: helptext_system_certificates.add.city.placeholder,
          tooltip: helptext_system_certificates.add.city.tooltip,
          required: true,
          validation: helptext_system_certificates.add.city.validation,
          isHidden: false,
          class: 'inline',
          width: '50%',
        },
        {
          type: 'input',
          name: 'organization',
          placeholder: helptext_system_certificates.add.organization.placeholder,
          tooltip: helptext_system_certificates.add.organization.tooltip,
          required: true,
          validation: helptext_system_certificates.add.organization.validation,
          isHidden: false,
          class: 'inline',
          width: '50%',
        },
        {
          type: 'input',
          name: 'organizational_unit',
          placeholder: helptext_system_certificates.add.organizational_unit.placeholder,
          tooltip: helptext_system_certificates.add.organizational_unit.tooltip,
          required: false,
          isHidden: false,
          class: 'inline',
          width: '50%',
        },
        {
          type: 'input',
          name: 'email',
          placeholder: helptext_system_certificates.add.email.placeholder,
          tooltip: helptext_system_certificates.add.email.tooltip,
          required: true,
          validation: helptext_system_certificates.add.email.validation,
          isHidden: false,
          class: 'inline',
          width: '50%',
        },
        {
          type: 'input',
          name: 'common',
          placeholder: helptext_system_certificates.add.common.placeholder,
          tooltip: helptext_system_certificates.add.common.tooltip,
          isHidden: false,
          class: 'inline',
          width: '50%',
        },
        {
          type: 'chip',
          name: 'san',
          placeholder: helptext_system_certificates.add.san.placeholder,
          tooltip: helptext_system_certificates.add.san.tooltip,
          required: true,
          validation: helptext_system_certificates.add.san.validation,
          isHidden: false,
          class: 'inline',
          width: '50%',
        },
      ]},
      {
        label: 'Other Stuff',
        fieldConfig: [
          {
            type: 'checkbox',
            name: 'BasicConstraints-enabled',
            placeholder: helptext_system_certificates.add.fieldset_basic_constraints,
            tooltip: helptext_system_certificates.add.basic_constraints.enabled.tooltip,
          },
          {
            type: 'input',
            inputType: 'number',
            name: 'BasicConstraints-path_length',
            placeholder: helptext_system_certificates.add.basic_constraints.path_length.placeholder,
            tooltip: helptext_system_certificates.add.basic_constraints.path_length.tooltip,
            relation: [
              {
                action: 'SHOW',
                when: [{
                  name: 'BasicConstraints-enabled',
                  value: true,
                }]
              },
            ]
          },
          {
            type: 'select',
            multiple: true,
            name: 'BasicConstraints',
            placeholder: helptext_system_certificates.add.basic_constraints.config.placeholder,
            tooltip: helptext_system_certificates.add.basic_constraints.config.tooltip,
            options: [
              {
                value: 'ca',
                label: helptext_system_certificates.add.basic_constraints.ca.placeholder,
                tooltip: helptext_system_certificates.add.basic_constraints.ca.tooltip,
              },
              {
                value: 'extension_critical',
                label: helptext_system_certificates.add.basic_constraints.extension_critical.placeholder,
                tooltip: helptext_system_certificates.add.basic_constraints.extension_critical.tooltip,
              }
            ],
            relation: [
              {
                action: 'SHOW',
                when: [{
                  name: 'BasicConstraints-enabled',
                  value: true,
                }]
              },
            ]
          },
          {
            type: 'checkbox',
            name: 'AuthorityKeyIdentifier-enabled',
            placeholder: helptext_system_certificates.add.fieldset_authority_key_identifier,
            tooltip: helptext_system_certificates.add.authority_key_identifier.enabled.tooltip,
          },
          {
            type: 'select',
            multiple: true,
            name: 'AuthorityKeyIdentifier',
            placeholder: helptext_system_certificates.add.authority_key_identifier.config.placeholder,
            tooltip: helptext_system_certificates.add.authority_key_identifier.config.tooltip,
            options: [
              {
                value: 'authority_cert_issuer',
                label: helptext_system_certificates.add.authority_key_identifier.authority_cert_issuer.placeholder,
                tooltip: helptext_system_certificates.add.authority_key_identifier.authority_cert_issuer.tooltip,
              },
              {
                value: 'extension_critical',
                label: helptext_system_certificates.add.authority_key_identifier.extension_critical.placeholder,
                tooltip: helptext_system_certificates.add.authority_key_identifier.extension_critical.tooltip,
              }
            ],
            relation: [
              {
                action: 'SHOW',
                when: [{
                  name: 'AuthorityKeyIdentifier-enabled',
                  value: true,
                }]
              },
            ]
          },
          {
            type: 'checkbox',
            name: 'ExtendedKeyUsage-enabled',
            placeholder: helptext_system_certificates.add.fieldset_extended_key_usage,
            tooltip: helptext_system_certificates.add.extended_key_usage.enabled.tooltip,
          },
          {
            type: 'select',
            multiple: true,
            name: 'ExtendedKeyUsage-usages',
            placeholder: helptext_system_certificates.add.extended_key_usage.usages.placeholder,
            tooltip: helptext_system_certificates.add.extended_key_usage.usages.tooltip,
            options: [],
            required: false,
            relation: [
              {
                action: 'SHOW',
                when: [{
                  name: 'ExtendedKeyUsage-enabled',
                  value: true,
                }]
              },
            ]
          },
          {
            type: 'checkbox',
            name: 'ExtendedKeyUsage-extension_critical',
            placeholder: helptext_system_certificates.add.extended_key_usage.extension_critical.placeholder,
            tooltip: helptext_system_certificates.add.extended_key_usage.extension_critical.tooltip,
            relation: [
              {
                action: 'SHOW',
                when: [{
                  name: 'ExtendedKeyUsage-enabled',
                  value: true,
                }]
              },
            ]
          },
          {
            type: 'checkbox',
            name: 'KeyUsage-enabled',
            placeholder: helptext_system_certificates.add.fieldset_key_usage,
            tooltip: helptext_system_certificates.add.key_usage.enabled.tooltip,
          },
          {
            type: 'select',
            multiple: true,
            name: 'KeyUsage',
            placeholder: helptext_system_certificates.add.key_usage.config.placeholder,
            tooltip: helptext_system_certificates.add.key_usage.config.tooltip,
            options: [
              {
                value: 'digital_signature',
                label: helptext_system_certificates.add.key_usage.digital_signature.placeholder,
                tooltip: helptext_system_certificates.add.key_usage.digital_signature.tooltip,
              },
              {
                value: 'content_commitment',
                label: helptext_system_certificates.add.key_usage.content_commitment.placeholder,
                tooltip: helptext_system_certificates.add.key_usage.content_commitment.tooltip,
              },
              {
                value: 'key_encipherment',
                label: helptext_system_certificates.add.key_usage.key_encipherment.placeholder,
                tooltip: helptext_system_certificates.add.key_usage.key_encipherment.tooltip,
              },
              {
                value: 'data_encipherment',
                label: helptext_system_certificates.add.key_usage.data_encipherment.placeholder,
                tooltip: helptext_system_certificates.add.key_usage.data_encipherment.tooltip,
              },
              {
                value: 'key_agreement',
                label: helptext_system_certificates.add.key_usage.key_agreement.placeholder,
                tooltip: helptext_system_certificates.add.key_usage.key_agreement.tooltip,
              },
              {
                value: 'key_cert_sign',
                label: helptext_system_certificates.add.key_usage.key_cert_sign.placeholder,
                tooltip: helptext_system_certificates.add.key_usage.key_cert_sign.tooltip,
              },
              {
                value: 'crl_sign',
                label: helptext_system_certificates.add.key_usage.crl_sign.placeholder,
                tooltip: helptext_system_certificates.add.key_usage.crl_sign.tooltip,
              },
              {
                value: 'encipher_only',
                label: helptext_system_certificates.add.key_usage.encipher_only.placeholder,
                tooltip: helptext_system_certificates.add.key_usage.encipher_only.tooltip,
              },
              {
                value: 'decipher_only',
                label: helptext_system_certificates.add.key_usage.decipher_only.placeholder,
                tooltip: helptext_system_certificates.add.key_usage.decipher_only.tooltip,
              },
              {
                value: 'extension_critical',
                label: helptext_system_certificates.add.key_usage.extension_critical.placeholder,
                tooltip: helptext_system_certificates.add.key_usage.extension_critical.tooltip,
              },
            ],
            relation: [
              {
                action: 'SHOW',
                when: [{
                  name: 'KeyUsage-enabled',
                  value: true,
                }]
              },
            ]
          }

        ]
  }]
  private internalFields: Array<any> = [
    ['none'],
    ['signedby', 'key_type', 'ec_curve', 'key_length', 'digest_algorithm', 'lifetime'],
    ['country', 'state', 'city', 'organization', 'organizational_unit', 'email', 'common', 'san']
  ];
  private importFields: Array<any> = [
    ['none'],
    ['certificate', 'privatekey', 'passphrase', 'passphrase2', 'csronsys', 'csrlist']
  ];
  private extensionFields: Array<any> = [
    ['none'], ['none'], ['none'],
    ['BasicConstraints-enabled',
    'BasicConstraints-path_length',
    'BasicConstraints',
    'AuthorityKeyIdentifier-enabled',
    'AuthorityKeyIdentifier',
    'ExtendedKeyUsage-enabled',
    'ExtendedKeyUsage-usages',
    'ExtendedKeyUsage-extension_critical',
    'KeyUsage-enabled',
    'KeyUsage']
  ];

  private country: any;
  private signedby: any;
  private csrlist: any;
  public identifier: any;
  public usageField: any;
  private currenProfile: any;
  public hideCancel = true;

  constructor(protected ws: WebSocketService, protected dialog: MatDialog,
              protected systemGeneralService: SystemGeneralService,
              private modalService: ModalService) {}

  preInit() {
    this.systemGeneralService.getUnsignedCAs().subscribe((res) => {
      this.signedby = this.wizardConfig.find(c => c.label === 'Certificate Options').fieldConfig.find(c => c.name === 'signedby');
      res.forEach((item) => {
        this.signedby.options.push(
            {label : item.name, value : item.id});
      });
    });

    this.ws.call('certificate.ec_curve_choices').subscribe((res) => {
      const ec_curves_field = this.wizardConfig.find(c => c.label === 'Certificate Options').fieldConfig.find(c => c.name === 'ec_curve');
      for(const key in res) {
        ec_curves_field.options.push({label: res[key], value: key});
      }
    });

    this.systemGeneralService.getCertificateCountryChoices().subscribe((res) => {
      this.country = this.wizardConfig.find(c => c.label === 'Subject').fieldConfig.find(c => c.name === 'country');
      for (const item in res) {
        this.country.options.push(
          { label : res[item], value : item}
        );
      };
    });

    this.ws.call('certificate.query').subscribe((res) => {
      this.csrlist = this.wizardConfig.find(c => c.label === 'Certificate Options').fieldConfig.find(c => c.name === 'csrlist');
      res.forEach((item) => {
        if (item.CSR !== null) {
          this.CSRList.push(item);
          this.csrlist.options.push(
            {label: item.name, value: item.id}
          )
        }
      })
    });

    this.usageField = this.wizardConfig.find(c => c.label === 'Other Stuff').fieldConfig.find(c => c.name === 'ExtendedKeyUsage-usages');
    this.ws.call('certificate.extended_key_usage_choices').subscribe((res) => {
      Object.keys(res).forEach(key => {
        this.usageField.options.push({label: res[key], value: key})
      });
    });

    const profilesField = this.wizardConfig.find(c => c.label === 'Identifier and Type').fieldConfig.find(c => c.name === 'profiles');
    this.ws.call('certificate.profiles').subscribe((res) => {
      Object.keys(res).forEach(item => {
        profilesField.options.push({label: item, value: res[item]});
      })
    });
  }

  afterInit(entityWizard: EntityWizardComponent) {
    this.entityWizard = entityWizard;
    this.title = helptext_system_certificates.add.title;
    // this.fieldConfig = entityWizard.fieldConfig;
    for (let i in this.internalFields) {
      this.internalFields[i].forEach(field => {
        // console.log(field, i)
        if (field !== 'none') {
          this.hideField(field, false, entityWizard, i);
        }
      })
    }
    // this.hideField(this.internalFields[2], true, entity)

    ( < FormGroup > entityWizard.formArray.get([0]).get('create_type')).valueChanges.subscribe((res) => {
        console.log(res)
      if (res == 'CERTIFICATE_CREATE_INTERNAL') {
        for (let i in this.internalFields) {
          this.internalFields[i].forEach(field => {
          this.hideField(field, false, entityWizard, i);
          })
        }
        for (let i in this.extensionFields) {
          this.extensionFields[i].forEach(field => {
            this.hideField(field, false, entityWizard, i)
          })
        }
        // This block makes the form reset its 'disabled/hidden' settings on switch of type
        if (entityWizard.formGroup.controls['key_type'].value === 'RSA') {
          entityWizard.setDisabled('ec_curve', true, 1, true);
        } else if (entityWizard.formGroup.controls['key_type'].value === 'EC') {
          entityWizard.setDisabled('key_length', true, 1, true);
        } 

      } else if (res == 'CERTIFICATE_CREATE_IMPORTED') {
        for (let i in this.internalFields) {
          // this.hideField(this.internalFields[i], true, entity);
        }
        for (let i in this.importFields) {
          this.importFields[i].forEach(field => {
            if (field !== 'none') {
              this.hideField(field, false, '?', i);
            }
          })
        }
        for (let i in this.extensionFields) {
          // this.hideField(this.extensionFields[i], true, entity);
        }
        // This block makes the form reset its 'disabled/hidden' settings on switch of type
        
        if (!( < FormGroup > entityWizard.formArray.get([1])).controls['csronsys'].value) {
          entityWizard.setDisabled('csrlist', true, 1, true);
        } else {
          entityWizard.setDisabled('privatekey', true, 1, true);
          entityWizard.setDisabled('passphrase', true, 1, true);
          entityWizard.setDisabled('passphrase2', true, 1, true);
        }
      }
    });

    ( < FormGroup > entityWizard.formArray.get([0]).get('name')).valueChanges.subscribe((res) => {
      this.identifier = res;
    });
  
    ( < FormGroup > entityWizard.formArray.get([0]).get('name')).statusChanges.subscribe((res) => {
      if (this.identifier && res === 'INVALID') {
        // _.find(this.fieldConfig)['hasErrors'] = true;
      } else {
        // _.find(this.fieldConfig)['hasErrors'] = false;
      }
    });

    ( < FormGroup > entityWizard.formArray.get([3]).get('ExtendedKeyUsage-enabled')).valueChanges.subscribe((res) => {
      const usagesRequired = res !== undefined ? res : false;
      this.usageField.required = usagesRequired;
      if (usagesRequired) {
        ( < FormGroup > entityWizard.formArray.get([3]).get('ExtendedKeyUsage-enabled')).setValidators([Validators.required]);
      } else {
        ( < FormGroup > entityWizard.formArray.get([3]).get('ExtendedKeyUsage-enabled')).clearValidators();
      }
      ( < FormGroup > entityWizard.formArray.get([3]).get('ExtendedKeyUsage-enabled')).updateValueAndValidity();
    });

    ( < FormGroup > entityWizard.formArray.get([0]).get('profiles')).valueChanges.subscribe((res) => {
      // undo revious profile settings
      this.loadProfiles(this.currenProfile, true);
      // load selected profile settings
      this.loadProfiles(res);
      this.currenProfile = res;
    });
  }

  loadProfiles(value, reset?) {
    if (value) {
      console.log(value)
      Object.keys(value).forEach(item => {
        if (item === 'cert_extensions') {
          Object.keys(value['cert_extensions']).forEach(type => {
            Object.keys(value['cert_extensions'][type]).forEach(prop => {
              console.log(type, prop);
              let ctrl = ( < FormGroup > this.entityWizard.formArray.get([3]).get(`${type}-${prop}`));
              if (ctrl) {
                if (reset && ctrl.value === value['cert_extensions'][type][prop]) {
                  ctrl.setValue(undefined);
                } else if (!reset){
                  ctrl.setValue(value['cert_extensions'][type][prop]);
                }
              } else {
                ctrl = ( < FormGroup > this.entityWizard.formArray.get([3]).get(type));
                const config = ctrl.value || [];
                const optionIndex = config.indexOf(prop);
                if (reset && value['cert_extensions'][type][prop] === true && optionIndex > -1) {
                  config.splice(optionIndex, 1);
                  ctrl.setValue(config);
                } else if (!reset){
                  if (value['cert_extensions'][type][prop] === true && optionIndex === -1) {
                    config.push(prop);
                  } else if (value['cert_extensions'][type][prop] === false && optionIndex > -1 ) {
                    config.splice(optionIndex, 1);
                  }
                  ctrl.setValue(config);
                }
              }
            })
          })
        } else {
          if (reset && this.entityWizard.formGroup.controls[item].value === value[item]) {
            this.entityWizard.formGroup.controls[item].setValue(undefined);
          } else if (!reset){
            this.entityWizard.formGroup.controls[item].setValue(value[item]);
          }
        }
      });
    }
  }

  hideField(fieldName: any, show: boolean, entityWizard: any, stepIndex: any) {
    // console.log(fieldName, stepIndex)
    let target = _.find(this.wizardConfig[stepIndex].fieldConfig, {name : fieldName});
    target['isHidden'] = show;
    this.entityWizard.setDisabled(fieldName, show, stepIndex, show);
  }

  beforeSubmit(data: any) {
    if (data.csronsys) {
      this.CSRList.forEach((item) => {
        if (item.id === data.csrlist) {
          data.privatekey = item.privatekey;
          data.passphrase = item.passphrase;
          data.passphrase2 = item.passphrase2;
          return;
        }
      })
    }
    delete data.csronsys;
    delete data.csrlist;

    // Addresses non-pristine field being mistaken for a passphrase of ''
    if (data.passphrase == '') {
      data.passphrase = undefined;
    }

    if (data.passphrase2) {
      delete data.passphrase2;
    }
    if (data.create_type === 'CERTIFICATE_CREATE_INTERNAL' || data.create_type === 'CERTIFICATE_CREATE_CSR') {
      const cert_extensions = {
        'BasicConstraints': {},
        'AuthorityKeyIdentifier': {},
        'ExtendedKeyUsage': {},
        'KeyUsage': {},
      }
      Object.keys(data).forEach(key => {
        if (key.startsWith('BasicConstraints') || key.startsWith('AuthorityKeyIdentifier') || key.startsWith('ExtendedKeyUsage') || key.startsWith('KeyUsage')) {
          const type_prop = key.split('-');
          if (data[key] === '') {
            data[key] = null;
          }
          if (data[key]) {
            if (type_prop.length === 1) {
              for (let i = 0; i < data[key].length; i++) {
                cert_extensions[type_prop[0]][data[key][i]] = true;
              }
            } else {
              cert_extensions[type_prop[0]][type_prop[1]] = data[key];
            }
          }
          delete data[key];
        }
      });
      data['cert_extensions'] = cert_extensions;

      delete data['profiles'];
    }    
  }

  customSubmit(payload){
    this.dialogRef = this.dialog.open(EntityJobComponent, { data: { "title": "" }});
    this.dialogRef.componentInstance.setDescription(("Working..."));
    this.dialogRef.componentInstance.setCall(this.addCall, [payload]);
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.subscribe((res) => {
      this.dialog.closeAll();
      this.modalService.close('slide-in-form');
      this.modalService.refreshTable();
    });
    this.dialogRef.componentInstance.failure.subscribe((res) => {
      this.dialogRef.close();
      this.modalService.refreshTable();
      new EntityUtils().handleWSError(this.entityWizard, res);
    });

  }


}
