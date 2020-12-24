import { Component } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';

import { helptext_system_ca } from 'app/helptext/system/ca';
import * as _ from 'lodash';
import { SystemGeneralService, WebSocketService } from '../../../../services/';
import { ModalService } from 'app/services/modal.service';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from '../../../common/entity/entity-form/models/fieldset.interface';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { DialogService } from '../../../../services/dialog.service';
import { T } from '../../../../translate-marker';

import { Wizard } from '../../../common/entity/entity-form/models/wizard.interface';
import { EntityWizardComponent } from '../../../common/entity/entity-wizard/entity-wizard.component';


@Component({
  selector : 'system-ca-add',
  template : `<entity-form [conf]="this"></entity-form>`,
  providers : [ SystemGeneralService ]
})

export class CertificateAuthorityAddComponent {

  protected addWsCall = "certificateauthority.create";
  protected isEntity: boolean = true;
  private title: string;
  public hideCancel = true;

  private isLinear = true;
  private summary = {};

  entityWizard: any;
  private currentStep = 0;

  public wizardConfig: Wizard[] = [
    {
      label: helptext_system_ca.add.fieldset_basic,
      fieldConfig: [
        {
          type: 'input',
          name: 'name',
          placeholder: helptext_system_ca.add.name.placeholder,
          tooltip: helptext_system_ca.add.name.tooltip,
          required: true,
          validation: helptext_system_ca.add.name.validation,
          hasErrors: false,
          errors: helptext_system_ca.add.name.errors,
        },
        {
          type: 'select',
          name: 'create_type',
          tooltip: helptext_system_ca.add.create_type.tooltip,
          placeholder: helptext_system_ca.add.create_type.placeholder,
          options: [
            { label: 'Internal CA', value: 'CA_CREATE_INTERNAL' },
            { label: 'Intermediate CA', value: 'CA_CREATE_INTERMEDIATE' },
            { label: 'Import CA', value: 'CA_CREATE_IMPORTED' },
          ],
          value: 'CA_CREATE_INTERNAL',
        },
        {
          type: 'select',
          name: 'profiles',
          placeholder: helptext_system_ca.add.profiles.placeholder,
          tooltip: helptext_system_ca.add.profiles.tooltip,
          options: [
            {
              label: '---------',
              value: {},
            }
          ],
          relation: [
            {
              action: 'HIDE',
              when: [{
                name: 'create_type',
                value: 'CA_CREATE_IMPORTED',
              }]
            },
          ]
        }
      ]
    },
    {
      label: helptext_system_ca.add.fieldset_type,
      fieldConfig: [
        {
          type: 'select',
          name: 'signedby',
          placeholder: helptext_system_ca.add.signedby.placeholder,
          tooltip: helptext_system_ca.add.signedby.tooltip,
          options: [
            { label: '---', value: null }
          ],
          isHidden: true,
          disabled: true,
          required: true,
          validation: helptext_system_ca.add.signedby.validation
        },
        {
          type: 'select',
          name: 'key_type',
          placeholder: helptext_system_ca.add.key_type.placeholder,
          tooltip: helptext_system_ca.add.key_type.tooltip,
          options: [
            { label: 'RSA', value: 'RSA' },
            { label: 'EC', value: 'EC' }
          ],
          value: 'RSA',
          isHidden: false,
          disabled: true,
          required: true,
          validation: helptext_system_ca.add.key_type.validation
        },
        {
          type: 'select',
          name: 'ec_curve',
          placeholder: helptext_system_ca.add.ec_curve.placeholder,
          tooltip: helptext_system_ca.add.ec_curve.tooltip,
          options: [],
          value: 'BrainpoolP512R1',
          isHidden: false,
          disabled: true,
          relation: [
            {
              action: 'SHOW',
              when: [{
                name: 'key_type',
                value: 'EC',
              }]
            },
          ],
        },
        {
          type: 'select',
          name: 'key_length',
          placeholder: helptext_system_ca.add.key_length.placeholder,
          tooltip: helptext_system_ca.add.key_length.tooltip,
          options: [
            { label: '1024', value: 1024 },
            { label: '2048', value: 2048 },
            { label: '4096', value: 4096 },
          ],
          value: 2048,
          required: true,
          validation: helptext_system_ca.add.key_length.validation,
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
          placeholder: helptext_system_ca.add.digest_algorithm.placeholder,
          tooltip: helptext_system_ca.add.digest_algorithm.tooltip,
          options: [
            { label: 'SHA1', value: 'SHA1' },
            { label: 'SHA224', value: 'SHA224' },
            { label: 'SHA256', value: 'SHA256' },
            { label: 'SHA384', value: 'SHA384' },
            { label: 'SHA512', value: 'SHA512' },
          ],
          value: 'SHA256',
          required: true,
          validation: helptext_system_ca.add.digest_algorithm.validation,
          isHidden: false,
        },
        {
          type: 'input',
          name: 'lifetime',
          placeholder: helptext_system_ca.add.lifetime.placeholder,
          tooltip: helptext_system_ca.add.lifetime.tooltip,
          inputType: 'number',
          required: true,
          value: 3650,
          validation: helptext_system_ca.add.lifetime.validation,
          isHidden: false,
        },
      ]
    },
    {
      label: helptext_system_ca.add.fieldset_certificate,
      fieldConfig: [
        {
          type: 'select',
          name: 'country',
          placeholder: helptext_system_ca.add.country.placeholder,
          tooltip: helptext_system_ca.add.country.tooltip,
          options: [
          ],
          value: 'US',
          required: true,
          validation: helptext_system_ca.add.country.validation,
          isHidden: false,
        },
        {
          type: 'input',
          name: 'state',
          placeholder: helptext_system_ca.add.state.placeholder,
          tooltip: helptext_system_ca.add.state.tooltip,
          required: true,
          validation: helptext_system_ca.add.state.validation,
          isHidden: false,
        },
        {
          type: 'input',
          name: 'city',
          placeholder: helptext_system_ca.add.city.placeholder,
          tooltip: helptext_system_ca.add.city.tooltip,
          required: true,
          validation: helptext_system_ca.add.city.validation,
          isHidden: false,
        },
        {
          type: 'input',
          name: 'organization',
          placeholder: helptext_system_ca.add.organization.placeholder,
          tooltip: helptext_system_ca.add.organization.tooltip,
          required: true,
          validation: helptext_system_ca.add.organization.validation,
          isHidden: false,
        },
        {
          type: 'input',
          name: 'organizational_unit',
          placeholder: helptext_system_ca.add.organizational_unit.placeholder,
          tooltip: helptext_system_ca.add.organizational_unit.tooltip,
          required: false,
          isHidden: false,
        },
        {
          type: 'input',
          name: 'email',
          placeholder: helptext_system_ca.add.email.placeholder,
          tooltip: helptext_system_ca.add.email.tooltip,
          required: true,
          validation: helptext_system_ca.add.email.validation,
          isHidden: false,
        },
        {
          type: 'input',
          name: 'common',
          placeholder: helptext_system_ca.add.common.placeholder,
          tooltip: helptext_system_ca.add.common.tooltip,
          isHidden: false,
        },
        {
          type: 'chip',
          name: 'san',
          placeholder: helptext_system_ca.add.san.placeholder,
          tooltip: helptext_system_ca.add.san.tooltip,
          required: true,
          validation: helptext_system_ca.add.san.validation,
          isHidden: false,
        }
      ]
    },
    {
      label: helptext_system_ca.add.fieldset_extra,
      fieldConfig: [
        {
          type: 'checkbox',
          name: 'BasicConstraints-enabled',
          placeholder: helptext_system_ca.add.basic_constraints.enabled.placeholder,
          tooltip: helptext_system_ca.add.basic_constraints.enabled.tooltip,
        },
        {
          type: 'input',
          inputType: 'number',
          name: 'BasicConstraints-path_length',
          placeholder: helptext_system_ca.add.basic_constraints.path_length.placeholder,
          tooltip: helptext_system_ca.add.basic_constraints.path_length.tooltip,
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
          placeholder: helptext_system_ca.add.basic_constraints.config.placeholder,
          tooltip: helptext_system_ca.add.basic_constraints.config.tooltip,
          options: [
            {
              value: 'ca',
              label: helptext_system_ca.add.basic_constraints.ca.placeholder,
              tooltip: helptext_system_ca.add.basic_constraints.ca.tooltip,
            },
            {
              value: 'extension_critical',
              label: helptext_system_ca.add.basic_constraints.extension_critical.placeholder,
              tooltip: helptext_system_ca.add.basic_constraints.extension_critical.tooltip,
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
          placeholder: helptext_system_ca.add.authority_key_identifier.enabled.placeholder,
          tooltip: helptext_system_ca.add.authority_key_identifier.enabled.tooltip,
        },
        {
          type: 'select',
          multiple: true,
          name: 'AuthorityKeyIdentifier',
          placeholder: helptext_system_ca.add.authority_key_identifier.config.placeholder,
          tooltip: helptext_system_ca.add.authority_key_identifier.config.tooltip,
          options: [
            {
              value: 'authority_cert_issuer',
              label: helptext_system_ca.add.authority_key_identifier.authority_cert_issuer.placeholder,
              tooltip: helptext_system_ca.add.authority_key_identifier.authority_cert_issuer.tooltip,
            },
            {
              value: 'extension_critical',
              label: helptext_system_ca.add.authority_key_identifier.extension_critical.placeholder,
              tooltip: helptext_system_ca.add.authority_key_identifier.extension_critical.tooltip,
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
          placeholder: helptext_system_ca.add.extended_key_usage.enabled.placeholder,
          tooltip: helptext_system_ca.add.extended_key_usage.enabled.tooltip,
        },
        {
          type: 'select',
          multiple: true,
          name: 'ExtendedKeyUsage-usages',
          placeholder: helptext_system_ca.add.extended_key_usage.usages.placeholder,
          tooltip: helptext_system_ca.add.extended_key_usage.usages.tooltip,
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
          placeholder: helptext_system_ca.add.extended_key_usage.extension_critical.placeholder,
          tooltip: helptext_system_ca.add.extended_key_usage.extension_critical.tooltip,
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
          placeholder: helptext_system_ca.add.key_usage.enabled.placeholder,
          tooltip: helptext_system_ca.add.key_usage.enabled.tooltip,
        },
        {
          type: 'select',
          multiple: true,
          name: 'KeyUsage',
          placeholder: helptext_system_ca.add.key_usage.config.placeholder,
          tooltip: helptext_system_ca.add.key_usage.config.tooltip,
          options: [
            {
              value: 'digital_signature',
              label: helptext_system_ca.add.key_usage.digital_signature.placeholder,
              tooltip: helptext_system_ca.add.key_usage.digital_signature.tooltip,
            },
            {
              value: 'content_commitment',
              label: helptext_system_ca.add.key_usage.content_commitment.placeholder,
              tooltip: helptext_system_ca.add.key_usage.content_commitment.tooltip,
            },
            {
              value: 'key_encipherment',
              label: helptext_system_ca.add.key_usage.key_encipherment.placeholder,
              tooltip: helptext_system_ca.add.key_usage.key_encipherment.tooltip,
            },
            {
              value: 'data_encipherment',
              label: helptext_system_ca.add.key_usage.data_encipherment.placeholder,
              tooltip: helptext_system_ca.add.key_usage.data_encipherment.tooltip,
            },
            {
              value: 'key_agreement',
              label: helptext_system_ca.add.key_usage.key_agreement.placeholder,
              tooltip: helptext_system_ca.add.key_usage.key_agreement.tooltip,
            },
            {
              value: 'key_cert_sign',
              label: helptext_system_ca.add.key_usage.key_cert_sign.placeholder,
              tooltip: helptext_system_ca.add.key_usage.key_cert_sign.tooltip,
            },
            {
              value: 'crl_sign',
              label: helptext_system_ca.add.key_usage.crl_sign.placeholder,
              tooltip: helptext_system_ca.add.key_usage.crl_sign.tooltip,
            },
            {
              value: 'encipher_only',
              label: helptext_system_ca.add.key_usage.encipher_only.placeholder,
              tooltip: helptext_system_ca.add.key_usage.encipher_only.tooltip,
            },
            {
              value: 'decipher_only',
              label: helptext_system_ca.add.key_usage.decipher_only.placeholder,
              tooltip: helptext_system_ca.add.key_usage.decipher_only.tooltip,
            },
            {
              value: 'extension_critical',
              label: helptext_system_ca.add.key_usage.extension_critical.placeholder,
              tooltip: helptext_system_ca.add.key_usage.extension_critical.tooltip,
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
        },
        {
          type: 'textarea',
          name: 'certificate',
          placeholder: helptext_system_ca.add.certificate.placeholder,
          tooltip: helptext_system_ca.add.certificate.tooltip,
          required: true,
          validation: helptext_system_ca.add.certificate.validation,
          isHidden: true,
        },
        {
          type: 'textarea',
          name: 'privatekey',
          placeholder: helptext_system_ca.add.privatekey.placeholder,
          tooltip: helptext_system_ca.add.privatekey.tooltip,
          isHidden: true,
        },
        {
          type: 'input',
          name: 'passphrase',
          placeholder: helptext_system_ca.add.passphrase.placeholder,
          tooltip: helptext_system_ca.add.passphrase.tooltip,
          inputType: 'password',
          validation: helptext_system_ca.add.passphrase.validation,
          isHidden: true,
          togglePw: true
        },
        {
          type: 'input',
          name: 'passphrase2',
          inputType: 'password',
          placeholder: helptext_system_ca.add.passphrase2.placeholder,
          isHidden: true
        }
      ]
    }
  ];

  private internalcaFields: Array<any> = [
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
  private intermediatecaFields: Array<any> = [
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
  private importcaFields: Array<any> = [
    'certificate',
    'privatekey',
    'passphrase',
    'passphrase2',
  ];
  private extensionFields: Array<any> = [
    'BasicConstraints-enabled',
    'BasicConstraints-path_length',
    'BasicConstraints',
    'AuthorityKeyIdentifier-enabled',
    'AuthorityKeyIdentifier',
    'ExtendedKeyUsage-enabled',
    'ExtendedKeyUsage-usages',
    'ExtendedKeyUsage-extension_critical',
    'KeyUsage-enabled',
    'KeyUsage',
  ];

  private relationFields: Array<any> = [
    'create_type',
    'key_type',
    'BasicConstraints-enabled',
    'AuthorityKeyIdentifier-enabled',
    'ExtendedKeyUsage-enabled',
    'KeyUsage-enabled',
  ];

  private country: any;
  private signedby: any;
  public identifier: any;
  public usageField: any;
  private currenProfile: any;
  private entityForm: any;

  constructor(protected ws: WebSocketService, private modalService: ModalService,
              protected loader: AppLoaderService, private dialogService: DialogService, 
              protected systemGeneralService: SystemGeneralService) {}

  preInit(entityWizard: EntityWizardComponent) {
    this.entityWizard = entityWizard;
    this.systemGeneralService.getUnsignedCAs().subscribe((res) => {
      this.signedby = this.getTarget('signedby');
      res.forEach((item) => {
        this.signedby.options.push(
            {label : item.name, value : item.id});
      });
    });

    this.ws.call('certificate.ec_curve_choices').subscribe((res) => {
      const ec_curves_field = this.getTarget('ec_curve')
      for(const key in res) {
        ec_curves_field.options.push({label: res[key], value: key});
      }
    });

   this.systemGeneralService.getCertificateCountryChoices().subscribe((res) => {
      this.country = this.getTarget('country');
      for (const item in res) {
        this.country.options.push(
          { label : res[item], value : item}
        );
      };
    });

    this.usageField = this.getTarget('ExtendedKeyUsage-usages');
    this.ws.call('certificate.extended_key_usage_choices').subscribe((res) => {
      Object.keys(res).forEach(key => {
        this.usageField.options.push({label: res[key], value: key})
      });
    });

    const profilesField = this.getTarget('profiles');
    this.ws.call('certificateauthority.profiles').subscribe((res) => {
      Object.keys(res).forEach(item => {
        profilesField.options.push({label: item, value: res[item]});
      })
    });
  }

  customNext(stepper) {
    stepper.next();
    this.currentStep = stepper._selectedIndex;    
  }

  getSummaryValueLabel(fieldConfig, value) {
    if (fieldConfig.type == 'select') {
      const option = fieldConfig.options.find(option => option.value == value);
      if (option) {
        value = option.label;
      }
    }

    return value;
  }

  addToSummary(fieldName) {
    const fieldConfig = this.getTarget(fieldName);
    if (!fieldConfig.isHidden) {
      const fieldName = fieldConfig.name;
      if (fieldConfig.value !== undefined) {
        this.summary[fieldConfig.placeholder] = this.getSummaryValueLabel(fieldConfig, fieldConfig.value);
      }        
      this.getField(fieldName).valueChanges.subscribe((res) => {
        this.summary[fieldConfig.placeholder] = this.getSummaryValueLabel(fieldConfig, res);
      })
    }
  }

  removeFromSummary(fieldName) {
    const fieldConfig = this.getTarget(fieldName);
    delete this.summary[fieldConfig.placeholder];
  }

  setSummary() {
    this.summary = {};
    this.wizardConfig.forEach((stepConfig) => {
      stepConfig.fieldConfig.forEach((fieldConfig) => {
        this.addToSummary(fieldConfig.name);
      });
    });
  }

  afterInit(entity: any) {
    this.entityForm = entity;
    this.title = helptext_system_ca.add.title;

    for (let i in this.intermediatecaFields) {
      this.hideField(this.intermediatecaFields[i], true, entity);
    }
    for (let i in this.importcaFields) {
      this.hideField(this.importcaFields[i], true, entity);
    }
    for (let i in this.internalcaFields) {
      this.hideField(this.internalcaFields[i], false, entity);
    }
    this.hideField(this.internalcaFields[1], true, entity)

    this.getField('create_type').valueChanges.subscribe((res) => {
      this.wizardConfig[1].skip = false;
      this.wizardConfig[2].skip = false;
      
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
        for (let i in this.extensionFields) {
          this.hideField(this.extensionFields[i], false, entity);
        }
        // This block makes the form reset its 'disabled/hidden' settings on switch of type
        if (this.getField('key_type').value === 'RSA') {
          this.hideField('ec_curve', true, entity);
        } else if (this.getField('key_type').value === 'EC') {
          this.hideField('key_length', true, entity);
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
        for (let i in this.extensionFields) {
          this.hideField(this.extensionFields[i], false, entity);
        }
        if (this.getField('key_type').value === 'RSA') {
          this.hideField('ec_curve', true, entity);
        } else if (this.getField('key_type').value === 'EC') {
          this.hideField('key_length', true, entity);
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
        for (let i in this.extensionFields) {
          this.hideField(this.extensionFields[i], true, entity);
        }

        this.wizardConfig[1].skip = true;
        this.wizardConfig[2].skip = true;
      }
      this.setSummary();
    })

    this.getField('name').valueChanges.subscribe((res) => {
      this.identifier = res;
      this.summary[this.getTarget('name').placeholder] = res;
      this.setSummary();
    })

    this.getField('name').statusChanges.subscribe((res) => {
      if (this.identifier && res === 'INVALID') {
        this.getTarget('name')['hasErrors'] = true;
      } else {
        this.getTarget('name')['hasErrors'] = false;
      }
      this.setSummary();
    })

    this.getField('ExtendedKeyUsage-enabled').valueChanges.subscribe((res) => {
      const usagesRequired = res !== undefined ? res : false;
      this.usageField.required = usagesRequired;
      this.summary[this.getTarget('ExtendedKeyUsage-enabled').placeholder] = usagesRequired;
      if (usagesRequired) {
        this.getField('ExtendedKeyUsage-usages').setValidators([Validators.required]);
      } else {
        this.getField('ExtendedKeyUsage-usages').clearValidators();
      }
      this.getField('ExtendedKeyUsage-usages').updateValueAndValidity();
      this.setSummary();
    })

    this.getField('profiles').valueChanges.subscribe((res) => {
      // undo revious profile settings
      this.loadProfiels(this.currenProfile, true);
      // load selected profile settings
      this.loadProfiels(res);
      this.currenProfile = res;
      this.setSummary();
    });

    for (let i in this.relationFields) {
      this.getField(this.relationFields[i]).valueChanges.subscribe((res) => {
        this.setSummary();
      })
    }

    this.setSummary();

  }

  loadProfiels(value, reset?) {
    if (value) {
      Object.keys(value).forEach(item => {
        if (item === 'cert_extensions') {
          Object.keys(value['cert_extensions']).forEach(type => {
            Object.keys(value['cert_extensions'][type]).forEach(prop => {
              let ctrl = this.getField(`${type}-${prop}`);
              if (ctrl) {
                if (reset && ctrl.value === value['cert_extensions'][type][prop]) {
                  ctrl.setValue(undefined);
                } else if (!reset){
                  ctrl.setValue(value['cert_extensions'][type][prop]);
                }
              } else {
                ctrl = this.getField(type);
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
          if (reset && this.entityForm.formGroup.controls[item].value === value[item]) {
            this.entityForm.formGroup.controls[item].setValue(undefined);
          } else if (!reset){
            this.entityForm.formGroup.controls[item].setValue(value[item]);
          }
        }
      });
    }
  }

  getStep(fieldName: any) {
    
    const stepNumber = this.wizardConfig.findIndex((step) => {
      const index = step.fieldConfig.findIndex(field => {
        return fieldName == field.name;
      });
      return index > -1;
    });

    return stepNumber;
  }

  getField(fieldName: any) {
    
    const stepNumber = this.getStep(fieldName);
    if (stepNumber > -1) {
      const target = ( < FormGroup > this.entityWizard.formArray.get([stepNumber])).controls[fieldName];
      return target;
    } else {
      return null;
    }    
  }

  getTarget(fieldName: any) {
    
    const stepNumber = this.getStep(fieldName);
    if (stepNumber > -1) {
      const target = _.find(this.wizardConfig[stepNumber].fieldConfig, {'name': fieldName});
      return target;
    } else {
      return null;
    }    
  }

  hideField(fieldName: any, show: boolean, entity: any) {
    this.getTarget(fieldName).isHidden = show;
    this.setDisabled(fieldName, show);
  }

  setDisabled(fieldName: any, disable: boolean) {    
    const target = this.getField(fieldName);    
    if (disable) {
      target.disable();
    } else {
      target.enable();
    }
  }

  beforeSubmit(data: any) {
    // Addresses non-pristine field being mistaken for a passphrase of ''
    if (data.passphrase == '') {
      data.passphrase = undefined;
    }
    if (data.passphrase2) {
      delete data.passphrase2;
    }
    if (data.create_type === 'CA_CREATE_INTERNAL' || data.create_type === 'CA_CREATE_INTERMEDIATE') {
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
          delete data[key]
        }
      });
      data['cert_extensions'] = cert_extensions;

      delete data['profiles'];
    }

    return data;
  }

  customSubmit(data) {
    this.loader.open();
    this.ws.call(this.addWsCall, [data]).subscribe(vm_res => {
      this.loader.close();
      this.modalService.refreshTable();
      this.modalService.close('slide-in-form');
    },(error) => {
      this.loader.close();
      this.dialogService.errorReport(T("Error creating CA."), error.reason, error.trace.formatted);
    });
  }

}
