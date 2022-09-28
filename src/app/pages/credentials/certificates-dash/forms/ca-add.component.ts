import { Component } from '@angular/core';
import { AbstractControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatStepper } from '@angular/material/stepper';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { CaCreateType } from 'app/enums/ca-create-type.enum';
import { helptextSystemCa } from 'app/helptext/system/ca';
import { CertificateExtensions } from 'app/interfaces/certificate-authority.interface';
import {
  CertificateExtension,
  CertificateProfile,
  CertificationExtensionAttribute,
} from 'app/interfaces/certificate.interface';
import { WizardConfiguration } from 'app/interfaces/entity-wizard.interface';
import { FieldConfig, FormSelectConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { RelationAction } from 'app/modules/entity/entity-form/models/relation-action.enum';
import { Wizard } from 'app/modules/entity/entity-form/models/wizard.interface';
import { EntityWizardComponent } from 'app/modules/entity/entity-wizard/entity-wizard.component';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SystemGeneralService, WebSocketService } from 'app/services';
import { DialogService } from 'app/services/dialog.service';
import { ModalService } from 'app/services/modal.service';

@UntilDestroy()
@Component({
  template: '<ix-entity-wizard [conf]="this"></ix-entity-wizard>',
  providers: [SystemGeneralService],
})
export class CertificateAuthorityAddComponent implements WizardConfiguration {
  addWsCall = 'certificateauthority.create' as const;
  private title: string;
  hideCancel = true;

  isLinear = true;
  summary: Record<string, unknown> = {};
  entityWizard: EntityWizardComponent;
  private currentStep = 0;

  wizardConfig: Wizard[] = [
    {
      label: helptextSystemCa.add.fieldset_basic,
      fieldConfig: [
        {
          type: 'input',
          name: 'name',
          placeholder: helptextSystemCa.add.name.placeholder,
          tooltip: helptextSystemCa.add.name.tooltip,
          required: true,
          validation: helptextSystemCa.add.name.validation,
          hasErrors: false,
          errors: helptextSystemCa.add.name.errors,
        },
        {
          type: 'select',
          name: 'create_type',
          tooltip: helptextSystemCa.add.create_type.tooltip,
          placeholder: helptextSystemCa.add.create_type.placeholder,
          options: [
            { label: 'Internal CA', value: CaCreateType.CaCreateInternal },
            { label: 'Intermediate CA', value: CaCreateType.CaCreateIntermediate },
            { label: 'Import CA', value: CaCreateType.CaCreateImported },
          ],
          value: CaCreateType.CaCreateInternal,
        },
        {
          type: 'select',
          name: 'profiles',
          placeholder: helptextSystemCa.add.profiles.placeholder,
          tooltip: helptextSystemCa.add.profiles.tooltip,
          options: [
            {
              label: '---------',
              value: {},
            },
          ],
          relation: [
            {
              action: RelationAction.Hide,
              when: [{
                name: 'create_type',
                value: CaCreateType.CaCreateImported,
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
          type: 'select',
          name: 'signedby',
          placeholder: helptextSystemCa.add.signedby.placeholder,
          tooltip: helptextSystemCa.add.signedby.tooltip,
          options: [],
          isHidden: true,
          disabled: true,
          required: true,
          validation: helptextSystemCa.add.signedby.validation,
        },
        {
          type: 'select',
          name: 'key_type',
          placeholder: helptextSystemCa.add.key_type.placeholder,
          tooltip: helptextSystemCa.add.key_type.tooltip,
          options: [
            { label: 'RSA', value: 'RSA' },
            { label: 'EC', value: 'EC' },
          ],
          value: 'RSA',
          isHidden: false,
          disabled: true,
          required: true,
          validation: helptextSystemCa.add.key_type.validation,
        },
        {
          type: 'select',
          name: 'ec_curve',
          placeholder: helptextSystemCa.add.ec_curve.placeholder,
          tooltip: helptextSystemCa.add.ec_curve.tooltip,
          options: [],
          value: 'BrainpoolP512R1',
          isHidden: false,
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
          placeholder: helptextSystemCa.add.key_length.placeholder,
          tooltip: helptextSystemCa.add.key_length.tooltip,
          options: [
            { label: '1024', value: 1024 },
            { label: '2048', value: 2048 },
            { label: '4096', value: 4096 },
          ],
          value: 2048,
          required: true,
          validation: helptextSystemCa.add.key_length.validation,
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
          placeholder: helptextSystemCa.add.digest_algorithm.placeholder,
          tooltip: helptextSystemCa.add.digest_algorithm.tooltip,
          options: [
            { label: 'SHA1', value: 'SHA1' },
            { label: 'SHA224', value: 'SHA224' },
            { label: 'SHA256', value: 'SHA256' },
            { label: 'SHA384', value: 'SHA384' },
            { label: 'SHA512', value: 'SHA512' },
          ],
          value: 'SHA256',
          required: true,
          validation: helptextSystemCa.add.digest_algorithm.validation,
          isHidden: false,
        },
        {
          type: 'input',
          name: 'lifetime',
          placeholder: helptextSystemCa.add.lifetime.placeholder,
          tooltip: helptextSystemCa.add.lifetime.tooltip,
          inputType: 'number',
          required: true,
          value: 3650,
          validation: helptextSystemCa.add.lifetime.validation,
          isHidden: false,
        },
      ],
    },
    {
      label: helptextSystemCa.add.fieldset_certificate,
      fieldConfig: [
        {
          type: 'select',
          name: 'country',
          placeholder: helptextSystemCa.add.country.placeholder,
          tooltip: helptextSystemCa.add.country.tooltip,
          options: [
          ],
          value: 'US',
          required: true,
          validation: helptextSystemCa.add.country.validation,
          isHidden: false,
        },
        {
          type: 'input',
          name: 'state',
          placeholder: helptextSystemCa.add.state.placeholder,
          tooltip: helptextSystemCa.add.state.tooltip,
          required: true,
          validation: helptextSystemCa.add.state.validation,
          isHidden: false,
        },
        {
          type: 'input',
          name: 'city',
          placeholder: helptextSystemCa.add.city.placeholder,
          tooltip: helptextSystemCa.add.city.tooltip,
          required: true,
          validation: helptextSystemCa.add.city.validation,
          isHidden: false,
        },
        {
          type: 'input',
          name: 'organization',
          placeholder: helptextSystemCa.add.organization.placeholder,
          tooltip: helptextSystemCa.add.organization.tooltip,
          required: true,
          validation: helptextSystemCa.add.organization.validation,
          isHidden: false,
        },
        {
          type: 'input',
          name: 'organizational_unit',
          placeholder: helptextSystemCa.add.organizational_unit.placeholder,
          tooltip: helptextSystemCa.add.organizational_unit.tooltip,
          required: false,
          isHidden: false,
        },
        {
          type: 'input',
          name: 'email',
          placeholder: helptextSystemCa.add.email.placeholder,
          tooltip: helptextSystemCa.add.email.tooltip,
          required: true,
          validation: helptextSystemCa.add.email.validation,
          isHidden: false,
        },
        {
          type: 'input',
          name: 'common',
          placeholder: helptextSystemCa.add.common.placeholder,
          tooltip: helptextSystemCa.add.common.tooltip,
          isHidden: false,
        },
        {
          type: 'chip',
          name: 'san',
          placeholder: helptextSystemCa.add.san.placeholder,
          tooltip: helptextSystemCa.add.san.tooltip,
          required: true,
          validation: helptextSystemCa.add.san.validation,
          isHidden: false,
        },
      ],
    },
    {
      label: helptextSystemCa.add.fieldset_extra,
      fieldConfig: [
        {
          type: 'checkbox',
          name: 'add_to_trusted_store',
          placeholder: helptextSystemCa.add.add_to_trusted_store.placeholder,
        },
        {
          type: 'checkbox',
          name: 'BasicConstraints-enabled',
          placeholder: helptextSystemCa.add.basic_constraints.enabled.placeholder,
          tooltip: helptextSystemCa.add.basic_constraints.enabled.tooltip,
        },
        {
          type: 'input',
          inputType: 'number',
          name: 'BasicConstraints-path_length',
          placeholder: helptextSystemCa.add.basic_constraints.path_length.placeholder,
          tooltip: helptextSystemCa.add.basic_constraints.path_length.tooltip,
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
          placeholder: helptextSystemCa.add.basic_constraints.config.placeholder,
          tooltip: helptextSystemCa.add.basic_constraints.config.tooltip,
          options: [
            {
              value: 'ca',
              label: helptextSystemCa.add.basic_constraints.ca.placeholder,
              tooltip: helptextSystemCa.add.basic_constraints.ca.tooltip,
            },
            {
              value: 'extension_critical',
              label: helptextSystemCa.add.basic_constraints.extension_critical.placeholder,
              tooltip: helptextSystemCa.add.basic_constraints.extension_critical.tooltip,
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
          placeholder: helptextSystemCa.add.authority_key_identifier.enabled.placeholder,
          tooltip: helptextSystemCa.add.authority_key_identifier.enabled.tooltip,
        },
        {
          type: 'select',
          multiple: true,
          name: 'AuthorityKeyIdentifier',
          placeholder: helptextSystemCa.add.authority_key_identifier.config.placeholder,
          tooltip: helptextSystemCa.add.authority_key_identifier.config.tooltip,
          options: [
            {
              value: 'authority_cert_issuer',
              label: helptextSystemCa.add.authority_key_identifier.authority_cert_issuer.placeholder,
              tooltip: helptextSystemCa.add.authority_key_identifier.authority_cert_issuer.tooltip,
            },
            {
              value: 'extension_critical',
              label: helptextSystemCa.add.authority_key_identifier.extension_critical.placeholder,
              tooltip: helptextSystemCa.add.authority_key_identifier.extension_critical.tooltip,
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
          placeholder: helptextSystemCa.add.extended_key_usage.enabled.placeholder,
          tooltip: helptextSystemCa.add.extended_key_usage.enabled.tooltip,
        },
        {
          type: 'select',
          multiple: true,
          name: 'ExtendedKeyUsage-usages',
          placeholder: helptextSystemCa.add.extended_key_usage.usages.placeholder,
          tooltip: helptextSystemCa.add.extended_key_usage.usages.tooltip,
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
          placeholder: helptextSystemCa.add.extended_key_usage.extension_critical.placeholder,
          tooltip: helptextSystemCa.add.extended_key_usage.extension_critical.tooltip,
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
          placeholder: helptextSystemCa.add.key_usage.enabled.placeholder,
          tooltip: helptextSystemCa.add.key_usage.enabled.tooltip,
        },
        {
          type: 'select',
          multiple: true,
          name: 'KeyUsage',
          placeholder: helptextSystemCa.add.key_usage.config.placeholder,
          tooltip: helptextSystemCa.add.key_usage.config.tooltip,
          options: [
            {
              value: 'digital_signature',
              label: helptextSystemCa.add.key_usage.digital_signature.placeholder,
              tooltip: helptextSystemCa.add.key_usage.digital_signature.tooltip,
            },
            {
              value: 'content_commitment',
              label: helptextSystemCa.add.key_usage.content_commitment.placeholder,
              tooltip: helptextSystemCa.add.key_usage.content_commitment.tooltip,
            },
            {
              value: 'key_encipherment',
              label: helptextSystemCa.add.key_usage.key_encipherment.placeholder,
              tooltip: helptextSystemCa.add.key_usage.key_encipherment.tooltip,
            },
            {
              value: 'data_encipherment',
              label: helptextSystemCa.add.key_usage.data_encipherment.placeholder,
              tooltip: helptextSystemCa.add.key_usage.data_encipherment.tooltip,
            },
            {
              value: 'key_agreement',
              label: helptextSystemCa.add.key_usage.key_agreement.placeholder,
              tooltip: helptextSystemCa.add.key_usage.key_agreement.tooltip,
            },
            {
              value: 'key_cert_sign',
              label: helptextSystemCa.add.key_usage.key_cert_sign.placeholder,
              tooltip: helptextSystemCa.add.key_usage.key_cert_sign.tooltip,
            },
            {
              value: 'crl_sign',
              label: helptextSystemCa.add.key_usage.crl_sign.placeholder,
              tooltip: helptextSystemCa.add.key_usage.crl_sign.tooltip,
            },
            {
              value: 'encipher_only',
              label: helptextSystemCa.add.key_usage.encipher_only.placeholder,
              tooltip: helptextSystemCa.add.key_usage.encipher_only.tooltip,
            },
            {
              value: 'decipher_only',
              label: helptextSystemCa.add.key_usage.decipher_only.placeholder,
              tooltip: helptextSystemCa.add.key_usage.decipher_only.tooltip,
            },
            {
              value: 'extension_critical',
              label: helptextSystemCa.add.key_usage.extension_critical.placeholder,
              tooltip: helptextSystemCa.add.key_usage.extension_critical.tooltip,
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
          placeholder: helptextSystemCa.add.certificate.placeholder,
          tooltip: helptextSystemCa.add.certificate.tooltip,
          required: true,
          validation: helptextSystemCa.add.certificate.validation,
          isHidden: true,
        },
        {
          type: 'textarea',
          name: 'privatekey',
          placeholder: helptextSystemCa.add.privatekey.placeholder,
          tooltip: helptextSystemCa.add.privatekey.tooltip,
          isHidden: true,
        },
        {
          type: 'input',
          name: 'passphrase',
          placeholder: helptextSystemCa.add.passphrase.placeholder,
          tooltip: helptextSystemCa.add.passphrase.tooltip,
          inputType: 'password',
          validation: helptextSystemCa.add.passphrase.validation,
          isHidden: true,
          togglePw: true,
        },
        {
          type: 'input',
          name: 'passphrase2',
          inputType: 'password',
          placeholder: helptextSystemCa.add.passphrase2.placeholder,
          isHidden: true,
        },
      ],
    },
  ];

  private internalcaFields = [
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
  private intermediatecaFields = [
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
  private importcaFields = [
    'certificate',
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

  private relationFields = [
    'create_type',
    'key_type',
    'BasicConstraints-enabled',
    'AuthorityKeyIdentifier-enabled',
    'ExtendedKeyUsage-enabled',
    'KeyUsage-enabled',
  ];

  private country: FormSelectConfig;
  private signedby: FormSelectConfig;
  identifier: string;
  usageField: FormSelectConfig;
  private currenProfile: CertificateProfile;
  private entityForm: EntityWizardComponent;

  constructor(
    protected ws: WebSocketService,
    private modalService: ModalService,
    protected loader: AppLoaderService,
    private dialogService: DialogService,
    protected systemGeneralService: SystemGeneralService,
    protected translate: TranslateService,
  ) {}

  preInit(entityWizard: EntityWizardComponent): void {
    this.entityWizard = entityWizard;
    this.systemGeneralService.getUnsignedCas().pipe(untilDestroyed(this)).subscribe((authorities) => {
      this.signedby = this.getTarget('signedby') as FormSelectConfig;
      authorities.forEach((authority) => {
        this.signedby.options.push(
          { label: authority.name, value: authority.id },
        );
      });
    });

    this.ws.call('certificate.ec_curve_choices').pipe(untilDestroyed(this)).subscribe((choices) => {
      const ecCurvesConfig = this.getTarget('ec_curve') as FormSelectConfig;
      for (const key in choices) {
        ecCurvesConfig.options.push({ label: choices[key], value: key });
      }
    });

    this.systemGeneralService.getCertificateCountryChoices().pipe(untilDestroyed(this)).subscribe((choices) => {
      this.country = this.getTarget('country') as FormSelectConfig;
      for (const item in choices) {
        this.country.options.push(
          { label: choices[item], value: item },
        );
      }
    });

    this.usageField = this.getTarget('ExtendedKeyUsage-usages') as FormSelectConfig;
    this.ws.call('certificate.extended_key_usage_choices').pipe(untilDestroyed(this)).subscribe((choices) => {
      Object.keys(choices).forEach((key) => {
        this.usageField.options.push({ label: choices[key], value: key });
      });
    });

    const profilesField = this.getTarget('profiles') as FormSelectConfig;
    this.ws.call('certificateauthority.profiles').pipe(untilDestroyed(this)).subscribe((profiles) => {
      Object.keys(profiles).forEach((profileName) => {
        profilesField.options.push({ label: profileName, value: profiles[profileName] });
      });
    });
  }

  customNext(stepper: MatStepper): void {
    stepper.next();
    this.currentStep = stepper.selectedIndex;
  }

  getSummaryValueLabel(fieldConfig: FieldConfig, value: unknown): unknown {
    if (fieldConfig.type === 'select') {
      const option = fieldConfig.options.find((option) => option.value === value);
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
    this.title = helptextSystemCa.add.title;

    this.intermediatecaFields.forEach((field) => this.hideField(field, true));
    this.importcaFields.forEach((field) => this.hideField(field, true));
    this.internalcaFields.forEach((field) => this.hideField(field, false));
    this.hideField(this.internalcaFields[1], true);

    this.getField('create_type').valueChanges.pipe(untilDestroyed(this)).subscribe((createType) => {
      this.wizardConfig[1].skip = false;
      this.wizardConfig[2].skip = false;

      if (createType === CaCreateType.CaCreateInternal) {
        this.intermediatecaFields.forEach((field) => this.hideField(field, true));
        this.importcaFields.forEach((field) => this.hideField(field, true));
        this.internalcaFields.forEach((field) => this.hideField(field, false));
        this.extensionFields.forEach((field) => this.hideField(field, false));

        // This block makes the form reset its 'disabled/hidden' settings on switch of type
        if (this.getField('key_type').value === 'RSA') {
          this.hideField('ec_curve', true);
        } else if (this.getField('key_type').value === 'EC') {
          this.hideField('key_length', true);
        }
        this.hideField('add_to_trusted_store', false);
        this.relationFields.forEach((field) => {
          if (field.includes('-enabled')) {
            this.getField(field).setValue(this.getField(field).value);
          }
        });
      } else if (createType === CaCreateType.CaCreateIntermediate) {
        this.importcaFields.forEach((field) => this.hideField(field, true));
        this.internalcaFields.forEach((field) => this.hideField(field, true));
        this.intermediatecaFields.forEach((field) => this.hideField(field, false));
        this.extensionFields.forEach((field) => this.hideField(field, false));
        if (this.getField('key_type').value === 'RSA') {
          this.hideField('ec_curve', true);
        } else if (this.getField('key_type').value === 'EC') {
          this.hideField('key_length', true);
        }
        this.hideField('add_to_trusted_store', true);
        this.relationFields.forEach((field) => {
          if (field.includes('-enabled')) {
            this.getField(field).setValue(this.getField(field).value);
          }
        });
      } else if (createType === CaCreateType.CaCreateImported) {
        this.intermediatecaFields.forEach((field) => this.hideField(field, true));
        this.importcaFields.forEach((field) => this.hideField(field, false));
        this.internalcaFields.forEach((field) => this.hideField(field, true));
        this.extensionFields.forEach((field) => this.hideField(field, true));
        this.hideField('add_to_trusted_store', false);

        this.wizardConfig[1].skip = true;
        this.wizardConfig[2].skip = true;
      }
      this.setSummary();
    });

    this.getField('name').valueChanges.pipe(untilDestroyed(this)).subscribe((name) => {
      this.identifier = name;
      this.summary[this.getTarget('name').placeholder] = name;
      this.setSummary();
    });

    this.getField('name').statusChanges.pipe(untilDestroyed(this)).subscribe((status) => {
      if (this.identifier && status === 'INVALID') {
        this.getTarget('name')['hasErrors'] = true;
      } else {
        this.getTarget('name')['hasErrors'] = false;
      }
      this.setSummary();
    });

    this.getField('ExtendedKeyUsage-enabled').valueChanges.pipe(untilDestroyed(this)).subscribe((enabled) => {
      const usagesRequired = enabled !== undefined ? enabled : false;
      this.usageField.required = usagesRequired;
      this.summary[this.getTarget('ExtendedKeyUsage-enabled').placeholder] = usagesRequired;
      if (usagesRequired) {
        this.getField('ExtendedKeyUsage-usages').setValidators([Validators.required]);
      } else {
        this.getField('ExtendedKeyUsage-usages').clearValidators();
      }
      this.getField('ExtendedKeyUsage-usages').updateValueAndValidity();
      this.setSummary();
    });

    this.getField('profiles').valueChanges.pipe(untilDestroyed(this)).subscribe((profile: CertificateProfile) => {
      // undo revious profile settings
      this.loadProfiles(this.currenProfile, true);
      // load selected profile settings
      this.loadProfiles(profile);
      this.currenProfile = profile;
      this.setSummary();
    });

    this.relationFields.forEach((field) => {
      this.getField(field).valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
        this.setSummary();
      });
    });

    this.setSummary();
  }

  loadProfiles(value: CertificateProfile, reset?: boolean): void {
    if (value) {
      Object.keys(value).forEach((item: keyof CertificateProfile) => {
        if (item === 'cert_extensions') {
          Object.keys(value['cert_extensions']).forEach((type: keyof CertificateExtensions) => {
            Object.keys(value['cert_extensions'][type]).forEach((prop: CertificationExtensionAttribute) => {
              const extension = value['cert_extensions'][type] as CertificateExtension;
              let ctrl = this.getField(`${type}-${prop}`);
              if (ctrl) {
                if (reset && ctrl.value === extension[prop]) {
                  ctrl.setValue(undefined);
                } else if (!reset) {
                  ctrl.setValue(extension[prop]);
                }
              } else {
                ctrl = this.getField(type);
                const config = ctrl.value || [];
                const optionIndex = config.indexOf(prop);
                if (reset && extension[prop] === true && optionIndex > -1) {
                  config.splice(optionIndex, 1);
                  ctrl.setValue(config);
                } else if (!reset) {
                  if (extension[prop] === true && optionIndex === -1) {
                    config.push(prop);
                  } else if (extension[prop] === false && optionIndex > -1) {
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
          this.entityForm.formGroup.controls[item]?.setValue(value[item]);
        }
      });
    }
  }

  getStep(fieldName: string): number {
    const stepNumber = this.wizardConfig.findIndex((step) => {
      const index = step.fieldConfig.findIndex((field) => fieldName === field.name);
      return index > -1;
    });

    return stepNumber;
  }

  getField(fieldName: string): AbstractControl {
    const stepNumber = this.getStep(fieldName);
    if (stepNumber > -1) {
      const target = (this.entityWizard.formArray.get([stepNumber]) as UntypedFormGroup).controls[fieldName];
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

  hideField(fieldName: string, isHidden: boolean): void {
    this.getTarget(fieldName).isHidden = isHidden;
    this.setDisabled(fieldName, isHidden);
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
    // Addresses non-pristine field being mistaken for a passphrase of ''
    if (data.passphrase === '') {
      data.passphrase = undefined;
    }
    if (data.passphrase2) {
      delete data.passphrase2;
    }
    if (data.create_type === CaCreateType.CaCreateInternal || data.create_type === CaCreateType.CaCreateIntermediate) {
      const certExtensions = {
        BasicConstraints: {},
        AuthorityKeyIdentifier: {},
        ExtendedKeyUsage: {},
        KeyUsage: {},
      } as CertificateExtensions;
      Object.keys(data).forEach((key) => {
        if (!key.startsWith('BasicConstraints') && !key.startsWith('AuthorityKeyIdentifier') && !key.startsWith('ExtendedKeyUsage') && !key.startsWith('KeyUsage')) {
          return;
        }

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
      });
      data['cert_extensions'] = certExtensions;

      delete data['profiles'];
    }
    if (data.create_type === CaCreateType.CaCreateIntermediate) {
      delete data['add_to_trusted_store'];
    }

    return data;
  }

  customSubmit(data: any): void {
    this.loader.open();
    this.ws.call(this.addWsCall, [data]).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.loader.close();
        this.modalService.refreshTable();
        this.modalService.closeSlideIn();
      },
      error: (error) => {
        this.loader.close();
        this.dialogService.errorReport(this.translate.instant('Error creating CA.'), error.reason, error.trace.formatted);
      },
    });
  }
}
