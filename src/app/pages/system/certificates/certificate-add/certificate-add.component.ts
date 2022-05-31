import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';

import * as _ from 'lodash';
import { RestService, SystemGeneralService, WebSocketService } from '../../../../services';
import { EntityJobComponent } from '../../../common/entity/entity-job/entity-job.component';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from '../../../common/entity/entity-form/models/fieldset.interface';
import { EntityUtils } from '../../../common/entity/utils';
import { helptext_system_certificates } from 'app/helptext/system/certificates';
import { helptext_system_ca } from 'app/helptext/system/ca';

@Component({
  selector: 'system-certificate-add',
  template: '<entity-form [conf]="this"></entity-form>',
  providers: [SystemGeneralService],
})

export class CertificateAddComponent {
  protected addCall = 'certificate.create';
  protected route_success: string[] = ['system', 'certificates'];
  protected isEntity = true;
  protected dialogRef: any;
  private entityForm: any;
  private CSRList = [];
  protected fieldConfig: FieldConfig[];
  fieldSets: FieldSet[] = [
    {
      name: helptext_system_certificates.add.fieldset_basic,
      label: true,
      class: 'basic',
      width: '50%',
      config: [
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
            { label: 'Certificate Signing Request', value: 'CERTIFICATE_CREATE_CSR' },
            { label: 'Import Certificate', value: 'CERTIFICATE_CREATE_IMPORTED' },
            { label: 'Import Certificate Signing Request', value: 'CERTIFICATE_CREATE_IMPORTED_CSR' },
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
              connective: 'OR',
              when: [{
                name: 'create_type',
                value: 'CERTIFICATE_CREATE_IMPORTED',
              }, {
                name: 'create_type',
                value: 'CERTIFICATE_CREATE_IMPORTED_CSR',
              }],
            },
          ],
        },
      ],
    },
    {
      name: helptext_system_ca.add.fieldset_type,
      label: true,
      class: 'type',
      width: '50%',
      config: [
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
            { label: '---', value: null },
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
              }],
            },
          ],
        },
        {
          type: 'select',
          name: 'signedby',
          placeholder: helptext_system_certificates.add.signedby.placeholder,
          tooltip: helptext_system_certificates.add.signedby.tooltip,
          options: [
            { label: '---', value: null },
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
            { label: 'EC', value: 'EC' },
          ],
          value: 'RSA',
          isHidden: false,
          disabled: true,
          required: true,
          validation: helptext_system_certificates.add.key_type.validation,
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
              }],
            },
          ],
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
              }],
            },
          ],
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
      ],
    },
    {
      name: helptext_system_certificates.add.fieldset_certificate,
      label: true,
      class: 'certificate',
      width: '100%',
      config: [
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
          name: 'CSR',
          placeholder: helptext_system_certificates.add.cert_csr.placeholder,
          tooltip: helptext_system_certificates.add.cert_csr.tooltip,
          required: true,
          validation: helptext_system_certificates.add.cert_csr.validation,
          isHidden: true,
        },
        {
          type: 'textarea',
          name: 'privatekey',
          placeholder: helptext_system_certificates.add.privatekey.placeholder,
          required: true,
          tooltip: helptext_system_certificates.add.privatekey.tooltip,
          isHidden: true,
          relation: [
            {
              action: 'DISABLE',
              when: [{
                name: 'csronsys',
                value: true,
              }],
            },
          ],
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
              }],
            },
          ],
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
              }],
            },
          ],
        },
      ],
    },
    {
      name: helptext_system_certificates.add.fieldset_basic_constraints,
      label: true,
      class: 'basic_constraints',
      width: '50%',
      config: [
        {
          type: 'checkbox',
          name: 'BasicConstraints-enabled',
          placeholder: helptext_system_certificates.add.basic_constraints.enabled.placeholder,
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
              }],
            },
          ],
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
            },
          ],
          relation: [
            {
              action: 'SHOW',
              when: [{
                name: 'BasicConstraints-enabled',
                value: true,
              }],
            },
          ],
        },
      ],
    },
    {
      name: helptext_system_certificates.add.fieldset_authority_key_identifier,
      label: true,
      class: 'authority_key_identifier',
      width: '50%',
      config: [
        {
          type: 'checkbox',
          name: 'AuthorityKeyIdentifier-enabled',
          placeholder: helptext_system_certificates.add.authority_key_identifier.enabled.placeholder,
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
            },
          ],
          relation: [
            {
              action: 'SHOW',
              when: [{
                name: 'AuthorityKeyIdentifier-enabled',
                value: true,
              }],
            },
          ],
        },
      ],
    },
    {
      name: helptext_system_certificates.add.fieldset_extended_key_usage,
      label: true,
      class: 'extended_key_usage',
      width: '50%',
      config: [
        {
          type: 'checkbox',
          name: 'ExtendedKeyUsage-enabled',
          placeholder: helptext_system_certificates.add.extended_key_usage.enabled.placeholder,
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
              }],
            },
          ],
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
              }],
            },
          ],
        },
      ],
    },
    {
      name: helptext_system_certificates.add.fieldset_key_usage,
      label: true,
      class: 'key_usage',
      width: '50%',
      config: [
        {
          type: 'checkbox',
          name: 'KeyUsage-enabled',
          placeholder: helptext_system_certificates.add.key_usage.enabled.placeholder,
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
              }],
            },
          ],
        },
      ],
    },
  ];
  private internalFields: any[] = [
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
  private csrFields: any[] = [
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
  private importFields: any[] = [
    'certificate',
    'csronsys',
    'csrlist',
    'privatekey',
    'passphrase',
    'passphrase2',
  ];
  private importCSRFields: any[] = [
    'CSR',
    'privatekey',
    'passphrase',
    'passphrase2',
  ];
  private extensionFields: any[] = [
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

  private country: any;
  private signedby: any;
  private csrlist: any;
  identifier: any;
  usageField: any;
  private currenProfile: any;

  constructor(protected router: Router, protected route: ActivatedRoute,
    protected rest: RestService, protected ws: WebSocketService, protected dialog: MatDialog,
    protected systemGeneralService: SystemGeneralService) {}

  preInit() {
    this.systemGeneralService.getUnsignedCAs().subscribe((res) => {
      this.signedby = _.find(this.fieldSets[1].config, { name: 'signedby' });
      res.forEach((item) => {
        this.signedby.options.push(
          { label: item.name, value: item.id },
        );
      });
    });

    this.ws.call('certificate.ec_curve_choices').subscribe((res) => {
      const ec_curves_field = _.find(this.fieldSets.find((set) => set.name === helptext_system_ca.add.fieldset_type).config, { name: 'ec_curve' });
      for (const key in res) {
        ec_curves_field.options.push({ label: res[key], value: key });
      }
    });

    this.systemGeneralService.getCertificateCountryChoices().subscribe((res) => {
      this.country = _.find(this.fieldSets[2].config, { name: 'country' });
      for (const item in res) {
        this.country.options.push(
          { label: res[item], value: item },
        );
      }
    });

    this.ws.call('certificate.query').subscribe((res) => {
      this.csrlist = _.find(this.fieldSets[1].config, { name: 'csrlist' });
      res.forEach((item) => {
        if (item.CSR !== null) {
          this.CSRList.push(item);
          this.csrlist.options.push(
            { label: item.name, value: item.id },
          );
        }
      });
    });

    this.usageField = _.find(this.fieldSets[5].config, { name: 'ExtendedKeyUsage-usages' });
    this.ws.call('certificate.extended_key_usage_choices').subscribe((res) => {
      Object.keys(res).forEach((key) => {
        this.usageField.options.push({ label: res[key], value: key });
      });
    });

    const profilesField = _.find(this.fieldSets[0].config, { name: 'profiles' });
    this.ws.call('certificate.profiles').subscribe((res) => {
      Object.keys(res).forEach((item) => {
        profilesField.options.push({ label: item, value: res[item] });
      });
    });
  }

  afterInit(entity: any) {
    this.entityForm = entity;
    this.fieldConfig = entity.fieldConfig;
    for (const i in this.csrFields) {
      this.hideField(this.csrFields[i], true, entity);
    }
    for (const i in this.importFields) {
      this.hideField(this.importFields[i], true, entity);
    }
    for (const i in this.importCSRFields) {
      this.hideField(this.importCSRFields[i], true, entity);
    }
    for (const i in this.internalFields) {
      this.hideField(this.internalFields[i], false, entity);
    }
    this.hideField(this.internalFields[2], true, entity);

    entity.formGroup.controls['create_type'].valueChanges.subscribe((res) => {
      if (res == 'CERTIFICATE_CREATE_INTERNAL') {
        for (const i in this.csrFields) {
          this.hideField(this.csrFields[i], true, entity);
        }
        for (const i in this.importFields) {
          this.hideField(this.importFields[i], true, entity);
        }
        for (const i in this.importCSRFields) {
          this.hideField(this.importCSRFields[i], true, entity);
        }
        for (const i in this.internalFields) {
          this.hideField(this.internalFields[i], false, entity);
        }
        for (const i in this.extensionFields) {
          this.hideField(this.extensionFields[i], false, entity);
        }
        // This block makes the form reset its 'disabled/hidden' settings on switch of type
        if (entity.formGroup.controls['key_type'].value === 'RSA') {
          entity.setDisabled('ec_curve', true);
        } else if (entity.formGroup.controls['key_type'].value === 'EC') {
          entity.setDisabled('key_length', true);
        }
      } else if (res == 'CERTIFICATE_CREATE_CSR') {
        for (const i in this.internalFields) {
          this.hideField(this.internalFields[i], true, entity);
        }
        for (const i in this.importFields) {
          this.hideField(this.importFields[i], true, entity);
        }
        for (const i in this.importCSRFields) {
          this.hideField(this.importCSRFields[i], true, entity);
        }
        for (const i in this.csrFields) {
          this.hideField(this.csrFields[i], false, entity);
        }
        for (const i in this.extensionFields) {
          this.hideField(this.extensionFields[i], false, entity);
        }
        // This block makes the form reset its 'disabled/hidden' settings on switch of type
        if (entity.formGroup.controls['key_type'].value === 'RSA') {
          entity.setDisabled('ec_curve', true);
        } else if (entity.formGroup.controls['key_type'].value === 'EC') {
          entity.setDisabled('key_length', true);
        }
      } else if (res == 'CERTIFICATE_CREATE_IMPORTED') {
        for (const i in this.internalFields) {
          this.hideField(this.internalFields[i], true, entity);
        }
        for (const i in this.csrFields) {
          this.hideField(this.csrFields[i], true, entity);
        }
        for (const i in this.importCSRFields) {
          this.hideField(this.importCSRFields[i], true, entity);
        }
        for (const i in this.importFields) {
          this.hideField(this.importFields[i], false, entity);
        }
        for (const i in this.extensionFields) {
          this.hideField(this.extensionFields[i], true, entity);
        }
        // This block makes the form reset its 'disabled/hidden' settings on switch of type
        if (!entity.formGroup.controls['csronsys'].value) {
          entity.setDisabled('csrlist', true);
        } else {
          entity.setDisabled('privatekey', true);
          entity.setDisabled('passphrase', true);
          entity.setDisabled('passphrase2', true);
        }
      } else if (res == 'CERTIFICATE_CREATE_IMPORTED_CSR') {
        for (const i in this.internalFields) {
          this.hideField(this.internalFields[i], true, entity);
        }
        for (const i in this.csrFields) {
          this.hideField(this.csrFields[i], true, entity);
        }
        for (const i in this.importFields) {
          this.hideField(this.importFields[i], true, entity);
        }
        for (const i in this.importCSRFields) {
          this.hideField(this.importCSRFields[i], false, entity);
        }
        for (const i in this.extensionFields) {
          this.hideField(this.extensionFields[i], true, entity);
        }
      }
    });

    entity.formGroup.controls['name'].valueChanges.subscribe((res) => {
      this.identifier = res;
    });

    entity.formGroup.controls['name'].statusChanges.subscribe((res) => {
      if (this.identifier && res === 'INVALID') {
        _.find(this.fieldConfig)['hasErrors'] = true;
      } else {
        _.find(this.fieldConfig)['hasErrors'] = false;
      }
    });

    entity.formGroup.controls['ExtendedKeyUsage-enabled'].valueChanges.subscribe((res) => {
      const usagesRequired = res !== undefined ? res : false;
      this.usageField.required = usagesRequired;
      if (usagesRequired) {
        entity.formGroup.controls['ExtendedKeyUsage-usages'].setValidators([Validators.required]);
      } else {
        entity.formGroup.controls['ExtendedKeyUsage-usages'].clearValidators();
      }
      entity.formGroup.controls['ExtendedKeyUsage-usages'].updateValueAndValidity();
    });

    entity.formGroup.controls['profiles'].valueChanges.subscribe((res) => {
      // undo revious profile settings
      this.loadProfiels(this.currenProfile, true);
      // load selected profile settings
      this.loadProfiels(res);
      this.currenProfile = res;
    });
  }

  loadProfiels(value, reset?) {
    if (value) {
      Object.keys(value).forEach((item) => {
        if (item === 'cert_extensions') {
          Object.keys(value['cert_extensions']).forEach((type) => {
            Object.keys(value['cert_extensions'][type]).forEach((prop) => {
              let ctrl = this.entityForm.formGroup.controls[`${type}-${prop}`];
              if (ctrl) {
                if (reset && ctrl.value === value['cert_extensions'][type][prop]) {
                  ctrl.setValue(undefined);
                } else if (!reset) {
                  ctrl.setValue(value['cert_extensions'][type][prop]);
                }
              } else {
                ctrl = this.entityForm.formGroup.controls[type];
                const config = ctrl.value || [];
                const optionIndex = config.indexOf(prop);
                if (reset && value['cert_extensions'][type][prop] === true && optionIndex > -1) {
                  config.splice(optionIndex, 1);
                  ctrl.setValue(config);
                } else if (!reset) {
                  if (value['cert_extensions'][type][prop] === true && optionIndex === -1) {
                    config.push(prop);
                  } else if (value['cert_extensions'][type][prop] === false && optionIndex > -1) {
                    config.splice(optionIndex, 1);
                  }
                  ctrl.setValue(config);
                }
              }
            });
          });
        } else if (reset && this.entityForm.formGroup.controls[item].value === value[item]) {
          this.entityForm.formGroup.controls[item].setValue(undefined);
        } else if (!reset) {
          this.entityForm.formGroup.controls[item].setValue(value[item]);
        }
      });
    }
  }

  hideField(fieldName: any, show: boolean, entity: any) {
    const target = _.find(this.fieldConfig, { name: fieldName });
    target['isHidden'] = show;
    entity.setDisabled(fieldName, show, show);
  }

  beforeSubmit(data: any) {
    if (data.csronsys) {
      this.CSRList.forEach((item) => {
        if (item.id === data.csrlist) {
          data.privatekey = item.privatekey;
          data.passphrase = item.passphrase;
          data.passphrase2 = item.passphrase2;
        }
      });
    }
    delete data.csronsys;
    delete data.csrlist;

    // Addresses non-pristine field being mistaken for a passphrase of ''
    if (data.passphrase == '') {
      data.passphrase = undefined;
      data.passphrase2 = undefined;
    }

    if (data.passphrase2) {
      delete data.passphrase2;
    }
    if (data.create_type === 'CERTIFICATE_CREATE_INTERNAL' || data.create_type === 'CERTIFICATE_CREATE_CSR') {
      const cert_extensions = {
        BasicConstraints: {},
        AuthorityKeyIdentifier: {},
        ExtendedKeyUsage: {},
        KeyUsage: {},
      };
      Object.keys(data).forEach((key) => {
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

  customSubmit(payload) {
    this.dialogRef = this.dialog.open(EntityJobComponent, { data: { title: '' } });
    this.dialogRef.componentInstance.setDescription(('Working...'));
    this.dialogRef.componentInstance.setCall(this.addCall, [payload]);
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.subscribe((res) => {
      this.dialog.closeAll();
      this.router.navigate(new Array('/').concat(this.route_success));
    });
    this.dialogRef.componentInstance.failure.subscribe((res) => {
      this.dialogRef.close();
      new EntityUtils().handleWSError(this.entityForm, res);
    });
  }
}
