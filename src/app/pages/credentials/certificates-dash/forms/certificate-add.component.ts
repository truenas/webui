import { Component } from '@angular/core';
import { AbstractControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatStepper } from '@angular/material/stepper';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { helptextSystemCa } from 'app/helptext/system/ca';
import { helptextSystemCertificates } from 'app/helptext/system/certificates';
import { Certificate, CertificateProfile } from 'app/interfaces/certificate.interface';
import { WizardConfiguration } from 'app/interfaces/entity-wizard.interface';
import { FieldConfig, FormSelectConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { RelationAction } from 'app/pages/common/entity/entity-form/models/relation-action.enum';
import { RelationConnection } from 'app/pages/common/entity/entity-form/models/relation-connection.enum';
import { Wizard } from 'app/pages/common/entity/entity-form/models/wizard.interface';
import { EntityJobComponent } from 'app/pages/common/entity/entity-job/entity-job.component';
import { EntityWizardComponent } from 'app/pages/common/entity/entity-wizard/entity-wizard.component';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { SystemGeneralService, WebSocketService } from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { DialogService } from 'app/services/dialog.service';
import { ModalService } from 'app/services/modal.service';

@UntilDestroy()
@Component({
  selector: 'system-certificate-add',
  template: '<entity-wizard [conf]="this"></entity-wizard>',
  providers: [SystemGeneralService],
})
export class CertificateAddComponent implements WizardConfiguration {
  addWsCall = 'certificate.create' as const;
  private entityForm: EntityWizardComponent;
  private CSRList: Certificate[] = [];
  title: string = helptextSystemCertificates.add.title;
  private getType = new Subscription();
  private type: string;
  hideCancel = true;
  isLinear = true;
  summary: Record<string, unknown> = {};

  entityWizard: EntityWizardComponent;
  private currentStep = 0;

  wizardConfig: Wizard[] = [
    {
      label: helptextSystemCertificates.add.fieldset_basic,
      fieldConfig: [
        {
          type: 'input',
          name: 'name',
          placeholder: helptextSystemCertificates.add.name.placeholder,
          tooltip: helptextSystemCertificates.add.name.tooltip,
          required: true,
          validation: helptextSystemCertificates.add.name.validation,
          hasErrors: false,
          errors: helptextSystemCertificates.add.name.errors,
        },
        {
          type: 'select',
          name: 'create_type',
          tooltip: helptextSystemCertificates.add.cert_create_type.tooltip,
          placeholder: helptextSystemCertificates.add.cert_create_type.placeholder,
          options: helptextSystemCertificates.add.cert_create_type.options,
          value: helptextSystemCertificates.add.cert_create_type.value,
        },
        {
          type: 'select',
          name: 'profiles',
          placeholder: helptextSystemCertificates.add.profiles.placeholder,
          tooltip: helptextSystemCertificates.add.profiles.tooltip,
          options: [{
            label: '---------',
            value: {},
          }],
          relation: [
            {
              action: RelationAction.Hide,
              connective: RelationConnection.Or,
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
      label: helptextSystemCa.add.fieldset_type,
      fieldConfig: [
        {
          type: 'checkbox',
          name: 'csronsys',
          placeholder: helptextSystemCertificates.add.isCSRonSystem.placeholder,
          tooltip: helptextSystemCertificates.add.isCSRonSystem.tooltip,
          isHidden: true,
          disabled: true,
        },
        {
          type: 'select',
          name: 'csrlist',
          placeholder: helptextSystemCertificates.add.signedby.placeholder,
          tooltip: helptextSystemCertificates.add.signedby.tooltip,
          options: [
            { label: '---', value: null },
          ],
          isHidden: true,
          disabled: true,
          required: true,
          validation: helptextSystemCertificates.add.signedby.validation,
          relation: [
            {
              action: RelationAction.Enable,
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
          placeholder: helptextSystemCertificates.add.signedby.placeholder,
          tooltip: helptextSystemCertificates.add.signedby.tooltip,
          options: [
            { label: '---', value: null },
          ],
          isHidden: true,
          disabled: true,
          required: true,
          validation: helptextSystemCertificates.add.signedby.validation,
        },
        {
          type: 'select',
          name: 'key_type',
          placeholder: helptextSystemCertificates.add.key_type.placeholder,
          tooltip: helptextSystemCa.add.key_type.tooltip,
          options: [
            { label: 'RSA', value: 'RSA' },
            { label: 'EC', value: 'EC' },
          ],
          value: 'RSA',
          isHidden: false,
          disabled: true,
          required: true,
          validation: helptextSystemCertificates.add.key_type.validation,
        },
        {
          type: 'select',
          name: 'ec_curve',
          placeholder: helptextSystemCertificates.add.ec_curve.placeholder,
          tooltip: helptextSystemCa.add.ec_curve.tooltip,
          options: [],
          value: 'BrainpoolP384R1',
          isHidden: true,
          disabled: true,
          relation: [
            {
              action: RelationAction.Show,
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
          placeholder: helptextSystemCertificates.add.key_length.placeholder,
          tooltip: helptextSystemCertificates.add.key_length.tooltip,
          options: [
            { label: '1024', value: 1024 },
            { label: '2048', value: 2048 },
            { label: '4096', value: 4096 },
          ],
          value: 2048,
          required: true,
          validation: helptextSystemCertificates.add.key_length.validation,
          isHidden: false,
          relation: [
            {
              action: RelationAction.Show,
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
          placeholder: helptextSystemCertificates.add.digest_algorithm.placeholder,
          tooltip: helptextSystemCertificates.add.digest_algorithm.tooltip,
          options: [
            { label: 'SHA1', value: 'SHA1' },
            { label: 'SHA224', value: 'SHA224' },
            { label: 'SHA256', value: 'SHA256' },
            { label: 'SHA384', value: 'SHA384' },
            { label: 'SHA512', value: 'SHA512' },
          ],
          value: 'SHA256',
          required: true,
          validation: helptextSystemCertificates.add.digest_algorithm.validation,
          isHidden: false,
        },
        {
          type: 'input',
          name: 'lifetime',
          placeholder: helptextSystemCertificates.add.lifetime.placeholder,
          tooltip: helptextSystemCertificates.add.lifetime.tooltip,
          inputType: 'number',
          required: true,
          value: 3650,
          validation: helptextSystemCertificates.add.lifetime.validation,
          isHidden: false,
        },
      ],
    },
    {
      label: helptextSystemCertificates.add.fieldset_certificate,
      fieldConfig: [
        {
          type: 'select',
          name: 'country',
          placeholder: helptextSystemCertificates.add.country.placeholder,
          tooltip: helptextSystemCertificates.add.country.tooltip,
          options: [
          ],
          value: 'US',
          required: true,
          validation: helptextSystemCertificates.add.country.validation,
          isHidden: false,
        },
        {
          type: 'input',
          name: 'state',
          placeholder: helptextSystemCertificates.add.state.placeholder,
          tooltip: helptextSystemCertificates.add.state.tooltip,
          required: true,
          validation: helptextSystemCertificates.add.state.validation,
          isHidden: false,
        },
        {
          type: 'input',
          name: 'city',
          placeholder: helptextSystemCertificates.add.city.placeholder,
          tooltip: helptextSystemCertificates.add.city.tooltip,
          required: true,
          validation: helptextSystemCertificates.add.city.validation,
          isHidden: false,
        },
        {
          type: 'input',
          name: 'organization',
          placeholder: helptextSystemCertificates.add.organization.placeholder,
          tooltip: helptextSystemCertificates.add.organization.tooltip,
          required: true,
          validation: helptextSystemCertificates.add.organization.validation,
          isHidden: false,
        },
        {
          type: 'input',
          name: 'organizational_unit',
          placeholder: helptextSystemCertificates.add.organizational_unit.placeholder,
          tooltip: helptextSystemCertificates.add.organizational_unit.tooltip,
          required: false,
          isHidden: false,
        },
        {
          type: 'input',
          name: 'email',
          placeholder: helptextSystemCertificates.add.email.placeholder,
          tooltip: helptextSystemCertificates.add.email.tooltip,
          required: true,
          validation: helptextSystemCertificates.add.email.validation,
          isHidden: false,
        },
        {
          type: 'input',
          name: 'common',
          placeholder: helptextSystemCertificates.add.common.placeholder,
          tooltip: helptextSystemCertificates.add.common.tooltip,
          isHidden: false,
        },
        {
          type: 'chip',
          name: 'san',
          placeholder: helptextSystemCertificates.add.san.placeholder,
          tooltip: helptextSystemCertificates.add.san.tooltip,
          required: true,
          validation: helptextSystemCertificates.add.san.validation,
          isHidden: false,
        },
      ],
    },
    {
      label: helptextSystemCertificates.add.fieldset_extra,
      fieldConfig: [
        {
          type: 'checkbox',
          name: 'BasicConstraints-enabled',
          placeholder: helptextSystemCertificates.add.basic_constraints.enabled.placeholder,
          tooltip: helptextSystemCertificates.add.basic_constraints.enabled.tooltip,
        },
        {
          type: 'input',
          inputType: 'number',
          name: 'BasicConstraints-path_length',
          placeholder: helptextSystemCertificates.add.basic_constraints.path_length.placeholder,
          tooltip: helptextSystemCertificates.add.basic_constraints.path_length.tooltip,
          relation: [
            {
              action: RelationAction.Show,
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
          placeholder: helptextSystemCertificates.add.basic_constraints.config.placeholder,
          tooltip: helptextSystemCertificates.add.basic_constraints.config.tooltip,
          options: [
            {
              value: 'ca',
              label: helptextSystemCertificates.add.basic_constraints.ca.placeholder,
              tooltip: helptextSystemCertificates.add.basic_constraints.ca.tooltip,
            },
            {
              value: 'extension_critical',
              label: helptextSystemCertificates.add.basic_constraints.extension_critical.placeholder,
              tooltip: helptextSystemCertificates.add.basic_constraints.extension_critical.tooltip,
            },
          ],
          relation: [
            {
              action: RelationAction.Show,
              when: [{
                name: 'BasicConstraints-enabled',
                value: true,
              }],
            },
          ],
        },
        {
          type: 'checkbox',
          name: 'AuthorityKeyIdentifier-enabled',
          placeholder: helptextSystemCertificates.add.authority_key_identifier.enabled.placeholder,
          tooltip: helptextSystemCertificates.add.authority_key_identifier.enabled.tooltip,
        },
        {
          type: 'select',
          multiple: true,
          name: 'AuthorityKeyIdentifier',
          placeholder: helptextSystemCertificates.add.authority_key_identifier.config.placeholder,
          tooltip: helptextSystemCertificates.add.authority_key_identifier.config.tooltip,
          options: [
            {
              value: 'authority_cert_issuer',
              label: helptextSystemCertificates.add.authority_key_identifier.authority_cert_issuer.placeholder,
              tooltip: helptextSystemCertificates.add.authority_key_identifier.authority_cert_issuer.tooltip,
            },
            {
              value: 'extension_critical',
              label: helptextSystemCertificates.add.authority_key_identifier.extension_critical.placeholder,
              tooltip: helptextSystemCertificates.add.authority_key_identifier.extension_critical.tooltip,
            },
          ],
          relation: [
            {
              action: RelationAction.Show,
              when: [{
                name: 'AuthorityKeyIdentifier-enabled',
                value: true,
              }],
            },
          ],
        },
        {
          type: 'checkbox',
          name: 'ExtendedKeyUsage-enabled',
          placeholder: helptextSystemCertificates.add.extended_key_usage.enabled.placeholder,
          tooltip: helptextSystemCertificates.add.extended_key_usage.enabled.tooltip,
        },
        {
          type: 'select',
          multiple: true,
          name: 'ExtendedKeyUsage-usages',
          placeholder: helptextSystemCertificates.add.extended_key_usage.usages.placeholder,
          tooltip: helptextSystemCertificates.add.extended_key_usage.usages.tooltip,
          options: [],
          required: false,
          relation: [
            {
              action: RelationAction.Show,
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
          placeholder: helptextSystemCertificates.add.extended_key_usage.extension_critical.placeholder,
          tooltip: helptextSystemCertificates.add.extended_key_usage.extension_critical.tooltip,
          relation: [
            {
              action: RelationAction.Show,
              when: [{
                name: 'ExtendedKeyUsage-enabled',
                value: true,
              }],
            },
          ],
        },
        {
          type: 'checkbox',
          name: 'KeyUsage-enabled',
          placeholder: helptextSystemCertificates.add.key_usage.enabled.placeholder,
          tooltip: helptextSystemCertificates.add.key_usage.enabled.tooltip,
        },
        {
          type: 'select',
          multiple: true,
          name: 'KeyUsage',
          placeholder: helptextSystemCertificates.add.key_usage.config.placeholder,
          tooltip: helptextSystemCertificates.add.key_usage.config.tooltip,
          options: [
            {
              value: 'digital_signature',
              label: helptextSystemCertificates.add.key_usage.digital_signature.placeholder,
              tooltip: helptextSystemCertificates.add.key_usage.digital_signature.tooltip,
            },
            {
              value: 'content_commitment',
              label: helptextSystemCertificates.add.key_usage.content_commitment.placeholder,
              tooltip: helptextSystemCertificates.add.key_usage.content_commitment.tooltip,
            },
            {
              value: 'key_encipherment',
              label: helptextSystemCertificates.add.key_usage.key_encipherment.placeholder,
              tooltip: helptextSystemCertificates.add.key_usage.key_encipherment.tooltip,
            },
            {
              value: 'data_encipherment',
              label: helptextSystemCertificates.add.key_usage.data_encipherment.placeholder,
              tooltip: helptextSystemCertificates.add.key_usage.data_encipherment.tooltip,
            },
            {
              value: 'key_agreement',
              label: helptextSystemCertificates.add.key_usage.key_agreement.placeholder,
              tooltip: helptextSystemCertificates.add.key_usage.key_agreement.tooltip,
            },
            {
              value: 'key_cert_sign',
              label: helptextSystemCertificates.add.key_usage.key_cert_sign.placeholder,
              tooltip: helptextSystemCertificates.add.key_usage.key_cert_sign.tooltip,
            },
            {
              value: 'crl_sign',
              label: helptextSystemCertificates.add.key_usage.crl_sign.placeholder,
              tooltip: helptextSystemCertificates.add.key_usage.crl_sign.tooltip,
            },
            {
              value: 'encipher_only',
              label: helptextSystemCertificates.add.key_usage.encipher_only.placeholder,
              tooltip: helptextSystemCertificates.add.key_usage.encipher_only.tooltip,
            },
            {
              value: 'decipher_only',
              label: helptextSystemCertificates.add.key_usage.decipher_only.placeholder,
              tooltip: helptextSystemCertificates.add.key_usage.decipher_only.tooltip,
            },
            {
              value: 'extension_critical',
              label: helptextSystemCertificates.add.key_usage.extension_critical.placeholder,
              tooltip: helptextSystemCertificates.add.key_usage.extension_critical.tooltip,
            },
          ],
          relation: [
            {
              action: RelationAction.Show,
              when: [{
                name: 'KeyUsage-enabled',
                value: true,
              }],
            },
          ],
        },
        {
          type: 'textarea',
          name: 'certificate',
          placeholder: helptextSystemCertificates.add.certificate.placeholder,
          tooltip: helptextSystemCertificates.add.certificate.tooltip,
          required: true,
          validation: helptextSystemCertificates.add.certificate.validation,
          isHidden: true,
        },
        {
          type: 'textarea',
          name: 'CSR',
          placeholder: helptextSystemCertificates.add.cert_csr.placeholder,
          tooltip: helptextSystemCertificates.add.cert_csr.tooltip,
          required: true,
          validation: helptextSystemCertificates.add.cert_csr.validation,
          isHidden: true,
        },
        {
          type: 'textarea',
          name: 'privatekey',
          placeholder: helptextSystemCertificates.add.privatekey.placeholder,
          required: true,
          tooltip: helptextSystemCertificates.add.privatekey.tooltip,
          isHidden: true,
          relation: [
            {
              action: RelationAction.Disable,
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
          placeholder: helptextSystemCertificates.add.passphrase.placeholder,
          tooltip: helptextSystemCertificates.add.passphrase.tooltip,
          inputType: 'password',
          validation: helptextSystemCertificates.add.passphrase.validation,
          isHidden: true,
          togglePw: true,
          relation: [
            {
              action: RelationAction.Disable,
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
          placeholder: helptextSystemCertificates.add.passphrase2.placeholder,
          isHidden: true,
          relation: [
            {
              action: RelationAction.Disable,
              when: [{
                name: 'csronsys',
                value: true,
              }],
            },
          ],
        },
      ],
    },

  ];
  private internalFields = [
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
  private csrFields = [
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
  private importFields = [
    'certificate',
    'csronsys',
    'csrlist',
    'privatekey',
    'passphrase',
    'passphrase2',
  ];
  private importCSRFields = [
    'CSR',
    'privatekey',
    'passphrase',
    'passphrase2',
  ];
  private extensionFields = [
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

  private country: FormSelectConfig;
  private signedby: FormSelectConfig;
  private csrlist: FormSelectConfig;
  identifier: string;
  usageField: FormSelectConfig;
  private currentProfile: CertificateProfile;

  constructor(
    protected ws: WebSocketService,
    protected dialog: MatDialog,
    protected systemGeneralService: SystemGeneralService,
    private modalService: ModalService,
    protected loader: AppLoaderService,
    private dialogService: DialogService,
    private translate: TranslateService,
  ) {
    this.getType = this.modalService.getRow$.pipe(untilDestroyed(this)).subscribe((rowId: string) => {
      this.type = rowId;
    });
  }

  preInit(entityWizard: EntityWizardComponent): void {
    this.entityWizard = entityWizard;
    this.systemGeneralService.getUnsignedCAs().pipe(untilDestroyed(this)).subscribe((res) => {
      this.signedby = this.getTarget('signedby') as FormSelectConfig;
      res.forEach((item) => {
        this.signedby.options.push(
          { label: item.name, value: item.id },
        );
      });
    });

    this.ws.call('certificate.ec_curve_choices').pipe(untilDestroyed(this)).subscribe((res) => {
      const ecCurvesConfig = this.getTarget('ec_curve') as FormSelectConfig;
      for (const key in res) {
        ecCurvesConfig.options.push({ label: res[key], value: key });
      }
    });

    this.systemGeneralService.getCertificateCountryChoices().pipe(untilDestroyed(this)).subscribe((res) => {
      this.country = this.getTarget('country') as FormSelectConfig;
      for (const item in res) {
        this.country.options.push(
          { label: res[item], value: item },
        );
      }
    });

    this.ws.call('certificate.query').pipe(untilDestroyed(this)).subscribe((certificates) => {
      this.csrlist = this.getTarget('csrlist') as FormSelectConfig;
      certificates.forEach((certificate) => {
        if (certificate.CSR !== null) {
          this.CSRList.push(certificate);
          this.csrlist.options.push(
            { label: certificate.name, value: certificate.id },
          );
        }
      });
    });

    this.usageField = this.getTarget('ExtendedKeyUsage-usages') as FormSelectConfig;
    this.ws.call('certificate.extended_key_usage_choices').pipe(untilDestroyed(this)).subscribe((choices) => {
      Object.keys(choices).forEach((key) => {
        this.usageField.options.push({ label: choices[key], value: key });
      });
    });

    const profilesField = this.getTarget('profiles') as FormSelectConfig;
    this.ws.call('certificate.profiles').pipe(untilDestroyed(this)).subscribe((profiles) => {
      Object.keys(profiles).forEach((item) => {
        profilesField.options.push({ label: item, value: (profiles[item]) });
      });
    });
  }

  customNext(stepper: MatStepper): void {
    stepper.next();
    this.currentStep = stepper.selectedIndex;
  }

  getSummaryValueLabel(fieldConfig: FieldConfig, value: any): any {
    if (fieldConfig.type == 'select') {
      const selectConfig: FormSelectConfig = fieldConfig as FormSelectConfig;
      const option = selectConfig.options.find((option) => option.value == value);
      if (option) {
        value = option.label;
      }
    }

    return value;
  }

  addToSummary(fieldName: string): void {
    const fieldConfig = this.getTarget(fieldName);
    if (!fieldConfig.isHidden) {
      const fieldName = fieldConfig.name;
      if (fieldConfig.value !== undefined) {
        this.summary[fieldConfig.placeholder] = this.getSummaryValueLabel(fieldConfig, fieldConfig.value);
      }
      this.getField(fieldName).valueChanges.pipe(untilDestroyed(this)).subscribe((res) => {
        this.summary[fieldConfig.placeholder] = this.getSummaryValueLabel(fieldConfig, res);
      });
    }
  }

  removeFromSummary(fieldName: string): void {
    const fieldConfig = this.getTarget(fieldName);
    delete this.summary[fieldConfig.placeholder];
  }

  setSummary(): void {
    this.summary = {};
    this.wizardConfig.forEach((stepConfig) => {
      stepConfig.fieldConfig.forEach((fieldConfig) => {
        this.addToSummary(fieldConfig.name);
      });
    });
  }

  afterInit(entity: EntityWizardComponent): void {
    this.entityForm = entity;

    this.csrFields.forEach((field) => this.hideField(field, true));
    this.importFields.forEach((field) => this.hideField(field, true));
    this.importCSRFields.forEach((field) => this.hideField(field, true));
    this.internalFields.forEach((field) => this.hideField(field, false));
    this.hideField(this.internalFields[2], true);
    this.getField('csronsys').valueChanges.pipe(untilDestroyed(this)).subscribe((res) => {
      this.hideField('csrlist', !res);
    });
    this.getField('create_type').valueChanges.pipe(untilDestroyed(this)).subscribe((res) => {
      this.wizardConfig[2].skip = false;

      if (res == 'CERTIFICATE_CREATE_INTERNAL') {
        this.csrFields.forEach((field) => this.hideField(field, true));
        this.importFields.forEach((field) => this.hideField(field, true));
        this.importCSRFields.forEach((field) => this.hideField(field, true));
        this.internalFields.forEach((field) => this.hideField(field, false));
        this.extensionFields.forEach((field) => this.hideField(field, false));

        // This block makes the form reset its 'disabled/hidden' settings on switch of type
        if (this.getField('key_type').value === 'RSA') {
          this.setDisabled('ec_curve', true);
          this.hideField('ec_curve', true);
        } else if (this.getField('key_type').value === 'EC') {
          this.setDisabled('key_length', true);
          this.hideField('ec_curve', false);
        }
      } else if (res == 'CERTIFICATE_CREATE_CSR') {
        this.importFields.forEach((field) => this.hideField(field, true));
        this.importCSRFields.forEach((field) => this.hideField(field, true));
        this.internalFields.forEach((field) => this.hideField(field, true));
        this.csrFields.forEach((field) => this.hideField(field, false));
        this.extensionFields.forEach((field) => this.hideField(field, false));

        // This block makes the form reset its 'disabled/hidden' settings on switch of type
        if (this.getField('key_type').value === 'RSA') {
          this.setDisabled('ec_curve', true);
          this.hideField('ec_curve', true);
        } else if (this.getField('key_type').value === 'EC') {
          this.setDisabled('key_length', true);
          this.hideField('ec_curve', false);
        }
      } else if (res == 'CERTIFICATE_CREATE_IMPORTED') {
        this.csrFields.forEach((field) => this.hideField(field, true));
        this.importCSRFields.forEach((field) => this.hideField(field, true));
        this.internalFields.forEach((field) => this.hideField(field, true));
        this.importFields.forEach((field) => this.hideField(field, false));
        this.extensionFields.forEach((field) => this.hideField(field, true));

        // This block makes the form reset its 'disabled/hidden' settings on switch of type
        if (!this.getField('csronsys').value) {
          this.hideField('csrlist', true);
        } else {
          this.setDisabled('privatekey', true);
          this.setDisabled('passphrase', true);
          this.setDisabled('passphrase2', true);
        }

        this.wizardConfig[2].skip = true;
      } else if (res == 'CERTIFICATE_CREATE_IMPORTED_CSR') {
        this.csrFields.forEach((field) => this.hideField(field, true));
        this.importFields.forEach((field) => this.hideField(field, true));
        this.internalFields.forEach((field) => this.hideField(field, true));
        this.importCSRFields.forEach((field) => this.hideField(field, false));
        this.extensionFields.forEach((field) => this.hideField(field, true));

        this.wizardConfig[2].skip = true;
      }

      this.setSummary();
    });

    this.getField('name').valueChanges.pipe(untilDestroyed(this)).subscribe((res) => {
      this.identifier = res;
      this.setSummary();
    });

    this.getField('name').statusChanges.pipe(untilDestroyed(this)).subscribe((res) => {
      if (this.identifier && res === 'INVALID') {
        this.getTarget('name')['hasErrors'] = true;
      } else {
        this.getTarget('name')['hasErrors'] = false;
      }
      this.setSummary();
    });

    this.getField('ExtendedKeyUsage-enabled').valueChanges.pipe(untilDestroyed(this)).subscribe((res) => {
      const usagesRequired = res !== undefined ? res : false;
      this.usageField.required = usagesRequired;
      if (usagesRequired) {
        this.getField('ExtendedKeyUsage-usages').setValidators([Validators.required]);
      } else {
        this.getField('ExtendedKeyUsage-usages').clearValidators();
      }
      this.getField('ExtendedKeyUsage-usages').updateValueAndValidity();
      this.setSummary();
    });

    this.getField('profiles').valueChanges.pipe(untilDestroyed(this)).subscribe((res: CertificateProfile) => {
      // undo revious profile settings
      this.loadProfiles(this.currentProfile, true);
      // load selected profile settings
      this.loadProfiles(res);
      this.currentProfile = res;
      this.setSummary();
    });

    if (this.type && this.type === 'csr') {
      this.getField('create_type').setValue(helptextSystemCertificates.add.csr_create_type.value);
      const certType = this.getTarget('create_type') as FormSelectConfig;
      certType.options = helptextSystemCertificates.add.csr_create_type.options;
      certType.placeholder = helptextSystemCertificates.add.csr_create_type.placeholder;
      certType.tooltip = helptextSystemCertificates.add.csr_create_type.tooltip;
      certType.value = helptextSystemCertificates.add.csr_create_type.value;
      this.title = helptextSystemCertificates.add.title_csr;
    }
    this.getField('KeyUsage-enabled').setValue(undefined);
    this.getField('ExtendedKeyUsage-enabled').setValue(undefined);
    this.getField('AuthorityKeyIdentifier-enabled').setValue(undefined);
    this.getField('BasicConstraints-enabled').setValue(undefined);

    this.setSummary();
  }

  loadProfiles(value: CertificateProfile, reset?: boolean): void {
    if (value) {
      Object.keys(value).forEach((item: keyof CertificateProfile) => {
        if (item === 'cert_extensions') {
          Object.keys(value['cert_extensions']).forEach((type) => {
            Object.keys(value['cert_extensions'][type]).forEach((prop) => {
              let ctrl = this.getField(`${type}-${prop}`);
              if (ctrl) {
                if (reset && ctrl.value === value['cert_extensions'][type][prop]) {
                  ctrl.setValue(undefined);
                } else if (!reset) {
                  ctrl.setValue(value['cert_extensions'][type][prop]);
                }
              } else {
                ctrl = this.getField(type);
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
        } else if (reset && this.getField(item).value === value[item]) {
          this.getField(item).setValue(undefined);
        } else if (!reset) {
          this.getField(item).setValue(value[item]);
        }
      });
    }
  }

  getStep(fieldName: string): number {
    const stepNumber = this.wizardConfig.findIndex((step) => {
      const index = step.fieldConfig.findIndex((field) => fieldName == field.name);
      return index > -1;
    });

    return stepNumber;
  }

  getField(fieldName: string): AbstractControl {
    const stepNumber = this.getStep(fieldName);
    if (stepNumber > -1) {
      const target = (this.entityWizard.formArray.get([stepNumber]) as FormGroup).controls[fieldName];
      return target;
    }
    return null;
  }

  getTarget(fieldName: string): FieldConfig {
    const stepNumber = this.getStep(fieldName);
    if (stepNumber > -1) {
      const target = _.find(this.wizardConfig[stepNumber].fieldConfig, { name: fieldName });
      return target;
    }
    return null;
  }

  hideField(fieldName: string, show: boolean): void {
    this.getTarget(fieldName).isHidden = show;
    this.setDisabled(fieldName, show);
  }

  setDisabled(fieldName: string, disable: boolean): void {
    const target = this.getField(fieldName);
    if (disable) {
      target.disable();
    } else {
      target.enable();
    }
  }

  beforeSubmit(data: any): any {
    if (data.san) {
      for (let i = 0; i < data.san.length; i++) {
        let sanValue = '';
        for (const key in data.san[i]) {
          sanValue += data.san[i][key];
        }
        data.san[i] = sanValue;
      }
    }
    if (data.csronsys) {
      this.CSRList.forEach((item) => {
        if (item.id === data.csrlist) {
          data.privatekey = item.privatekey;
          data.passphrase = (item as any).passphrase;
          data.passphrase2 = (item as any).passphrase2;
        }
      });
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
      const certExtensions = {
        BasicConstraints: {},
        AuthorityKeyIdentifier: {},
        ExtendedKeyUsage: {},
        KeyUsage: {},
      };
      Object.keys(data).forEach((key) => {
        if (key.startsWith('BasicConstraints') || key.startsWith('AuthorityKeyIdentifier') || key.startsWith('ExtendedKeyUsage') || key.startsWith('KeyUsage')) {
          const typeProp = key.split('-');
          if (data[key] === '') {
            data[key] = null;
          }
          if (data[key]) {
            if (typeProp.length === 1) {
              for (const item of data[key]) {
                (certExtensions as any)[typeProp[0]][item] = true;
              }
            } else {
              (certExtensions as any)[typeProp[0]][typeProp[1]] = data[key];
            }
          }
          delete data[key];
        }
      });
      data['cert_extensions'] = certExtensions;

      delete data['profiles'];
    }
    return data;
  }

  customSubmit(data: any): void {
    const dialogRef = this.dialog.open(EntityJobComponent, { data: { title: this.translate.instant('Creating Certificate') }, disableClose: true });
    dialogRef.componentInstance.setCall(this.addWsCall, [data]);
    dialogRef.componentInstance.submit();
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      this.dialog.closeAll();
      this.modalService.closeSlideIn();
      this.modalService.refreshTable();
    });
    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((err) => {
      this.dialog.closeAll();
      // Dialog needed b/c handleWSError doesn't open a dialog when rejection comes back from provider
      if (err.error.includes('[EFAULT')) {
        new EntityUtils().handleWSError(this.entityForm, err);
      } else {
        this.dialogService.errorReport(helptextSystemCertificates.acme.error_dialog.title,
          err.exc_info.type, err.exception);
      }
    });
  }
}
