import { Component } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogRef } from '@angular/material/dialog/dialog-ref';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { helptextSystemCertificates } from 'app/helptext/system/certificates';
import { Certificate } from 'app/interfaces/certificate.interface';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { QueryFilter } from 'app/interfaces/query-api.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form/entity-form.component';
import {
  FieldConfig, FormListConfig, FormParagraphConfig, FormSelectConfig,
} from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { EntityFormService } from 'app/pages/common/entity/entity-form/services/entity-form.service';
import { EntityJobComponent } from 'app/pages/common/entity/entity-job/entity-job.component';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { WebSocketService, DialogService } from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { ModalService } from 'app/services/modal.service';

@UntilDestroy()
@Component({
  selector: 'app-certificate-acme-add',
  template: '<entity-form [conf]="this"></entity-form>',
  providers: [EntityFormService],
})
export class CertificateAcmeAddComponent implements FormConfiguration {
  addCall = 'certificate.create' as const;
  queryCall = 'certificate.query' as const;
  isEntity = true;
  isNew = true;
  private csrOrg: Certificate;
  formArray: FormArray;
  commonName: string;
  private getRow = new Subscription();
  private rowNum: number;
  private dnsMapField: FormSelectConfig;
  title = helptextSystemCertificates.list.action_create_acme_certificate;
  protected isOneColumnForm = true;
  fieldConfig: FieldConfig[];
  fieldSets: FieldSet[] = [
    {
      name: helptextSystemCertificates.acme.fieldset_acme,
      label: false,
      class: 'acme',
      width: '100%',
      config: [
        {
          type: 'input',
          name: 'identifier',
          placeholder: helptextSystemCertificates.acme.identifier.placeholder,
          tooltip: helptextSystemCertificates.acme.identifier.tooltip,
          required: true,
          validation: helptextSystemCertificates.add.name.validation,
          hasErrors: false,
          errors: 'Allowed characters: letters, numbers, underscore (_), and dash (-).',
        },
        {
          type: 'checkbox',
          name: 'tos',
          placeholder: helptextSystemCertificates.acme.tos.placeholder,
          tooltip: helptextSystemCertificates.acme.tos.tooltip,
          required: true,
        },
        {
          type: 'input',
          name: 'renew_days',
          placeholder: helptextSystemCertificates.acme.renew_day.placeholder,
          tooltip: helptextSystemCertificates.acme.renew_day.tooltip,
          inputType: 'number',
          required: true,
          value: 10,
          validation: helptextSystemCertificates.acme.renew_day.validation,
        },
        {
          type: 'select',
          name: 'acme_directory_uri',
          placeholder: helptextSystemCertificates.acme.dir_uri.placeholder,
          tooltip: helptextSystemCertificates.acme.dir_uri.tooltip,
          required: true,
          options: [
          ],
        },
      ],
    },
    {
      name: 'mid_divider',
      divider: true,
    },
    {
      name: 'Domains',
      width: '100%',
      label: true,
      class: 'domain_list',
      config: [
        {
          type: 'list',
          name: 'domains',
          placeholder: '',
          hideButton: true,
          width: '100%',
          templateListField: [
            {
              type: 'paragraph',
              name: 'name_text',
              paraText: '',
              width: '100%',
            },
            {
              type: 'select',
              name: 'authenticators',
              placeholder: helptextSystemCertificates.acme.authenticator.placeholder,
              tooltip: helptextSystemCertificates.acme.authenticator.tooltip,
              required: true,
              options: [],
            },
          ],
          listFields: [],
        },
      ],
    },
  ];

  protected entityForm: EntityFormComponent;
  protected dialogRef: MatDialogRef<EntityJobComponent>;
  queryCallOption: [QueryFilter<Certificate>];
  initialCount = 1;
  private domainList: FormArray;
  private domainListField: FormListConfig;

  constructor(
    protected ws: WebSocketService,
    protected loader: AppLoaderService, private dialog: MatDialog,
    protected entityFormService: EntityFormService, protected dialogService: DialogService,
    private modalService: ModalService,
  ) {
    this.getRow = this.modalService.getRow$.pipe(untilDestroyed(this)).subscribe((rowId: number) => {
      this.rowNum = rowId;
      this.queryCallOption = [['id', '=', rowId]];
      this.getRow.unsubscribe();
    });
  }

  preInit(entityForm: EntityFormComponent): void {
    this.ws.call('acme.dns.authenticator.query').pipe(untilDestroyed(this)).subscribe((authenticators) => {
      const listConfig = this.fieldSets[2].config[0] as FormListConfig;
      this.dnsMapField = _.find(listConfig.templateListField, { name: 'authenticators' }) as FormSelectConfig;
      authenticators.forEach((item) => {
        this.dnsMapField.options.push({ label: item.name, value: item.id });
      });
    });

    this.ws.call('certificate.acme_server_choices').pipe(untilDestroyed(this)).subscribe((choices) => {
      const acmeDirectoryUri = _.find(this.fieldSets[0].config, { name: 'acme_directory_uri' }) as FormSelectConfig;
      for (const key in choices) {
        acmeDirectoryUri.options.push({ label: choices[key], value: key });
      }
      entityForm.formGroup.controls['acme_directory_uri'].setValue(Object.keys(choices)[0]);
    });
  }

  afterInit(entityEdit: EntityFormComponent): void {
    this.entityForm = entityEdit;
    this.fieldConfig = entityEdit.fieldConfig;

    this.domainList = entityEdit.formGroup.controls['domains'] as FormArray;
    this.domainListField = _.find(this.fieldConfig, { name: 'domains' }) as FormListConfig;
    const listFields = this.domainListField.listFields;

    this.ws.call(this.queryCall, [this.queryCallOption]).pipe(untilDestroyed(this)).subscribe((res) => {
      this.commonName = res[0].common;
      this.csrOrg = res[0];

      this.ws.call('certificate.get_domain_names', [this.rowNum]).pipe(untilDestroyed(this)).subscribe((domains) => {
        if (domains && domains.length > 0) {
          for (let i = 0; i < domains.length; i++) {
            if (this.domainList.controls[i] === undefined) {
              const templateListField = _.cloneDeep(this.domainListField.templateListField);
              const newfg = this.entityFormService.createFormGroup(templateListField);
              newfg.setParent(this.domainList);
              this.domainList.controls.push(newfg);
              this.domainListField.listFields.push(templateListField);
            }

            const controls = listFields[i];
            const nameTextConfig: FormParagraphConfig = _.find(controls, { name: 'name_text' });
            const authConfig = _.find(controls, { name: 'authenticators' }) as FormSelectConfig;
            (this.domainList.controls[i] as FormGroup).controls['name_text'].setValue(domains[i]);
            nameTextConfig.paraText = '<b>' + domains[i] + '</b>';
            authConfig.options = this.dnsMapField.options;
          }
        }
      });
    });
  }

  customSubmit(value: any): void {
    const dnsMapping: any = { };
    value.domains.forEach((domain: any) => {
      dnsMapping[domain.name_text] = domain.authenticators;
    });

    const payload = value;
    payload['name'] = value.identifier;
    delete payload['identifier'];
    payload['csr_id'] = this.csrOrg.id;
    payload['create_type'] = 'CERTIFICATE_CREATE_ACME';
    payload['dns_mapping'] = dnsMapping;
    delete payload['domains'];
    this.dialogRef = this.dialog.open(EntityJobComponent, {
      data: {
        title: (
          helptextSystemCertificates.acme.job_dialog_title),
      },
      disableClose: true,
    });
    this.dialogRef.componentInstance.setCall(this.addCall, [payload]);
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      this.dialog.closeAll();
      this.modalService.closeSlideIn();
      this.modalService.refreshTable();
    });
    this.dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((err) => {
      this.dialog.closeAll();
      // Dialog needed b/c handleWSError doesn't open a dialog when rejection comes back from provider
      if (err.error.includes('[EFAULT')) {
        new EntityUtils().handleWsError(this.entityForm, err);
      } else {
        this.dialogService.errorReport(helptextSystemCertificates.acme.error_dialog.title,
          err.exc_info.type, err.exception);
      }
    });
  }
}
