import { Component } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogRef } from '@angular/material/dialog/dialog-ref';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { helptext_system_certificates } from 'app/helptext/system/certificates';
import { Certificate } from 'app/interfaces/certificate.interface';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { QueryFilter } from 'app/interfaces/query-api.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
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
  addCall: 'certificate.create' = 'certificate.create';
  queryCall: 'certificate.query' = 'certificate.query';
  isEntity = true;
  isNew = true;
  private csrOrg: Certificate;
  formArray: FormArray;
  commonName: string;
  private getRow = new Subscription();
  private rowNum: any;
  private dns_map: FormSelectConfig;
  title = helptext_system_certificates.list.action_create_acme_certificate;
  protected isOneColumnForm = true;
  fieldConfig: FieldConfig[];
  fieldSets: FieldSet[] = [
    {
      name: helptext_system_certificates.acme.fieldset_acme,
      label: false,
      class: 'acme',
      width: '100%',
      config: [
        {
          type: 'input',
          name: 'identifier',
          placeholder: helptext_system_certificates.acme.identifier.placeholder,
          tooltip: helptext_system_certificates.acme.identifier.tooltip,
          required: true,
          validation: helptext_system_certificates.add.name.validation,
          hasErrors: false,
          errors: 'Allowed characters: letters, numbers, underscore (_), and dash (-).',
        },
        {
          type: 'checkbox',
          name: 'tos',
          placeholder: helptext_system_certificates.acme.tos.placeholder,
          tooltip: helptext_system_certificates.acme.tos.tooltip,
          required: true,
        },
        {
          type: 'input',
          name: 'renew_days',
          placeholder: helptext_system_certificates.acme.renew_day.placeholder,
          tooltip: helptext_system_certificates.acme.renew_day.tooltip,
          inputType: 'number',
          required: true,
          value: 10,
          validation: helptext_system_certificates.acme.renew_day.validation,
        },
        {
          type: 'select',
          name: 'acme_directory_uri',
          placeholder: helptext_system_certificates.acme.dir_uri.placeholder,
          tooltip: helptext_system_certificates.acme.dir_uri.tooltip,
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
              placeholder: helptext_system_certificates.acme.authenticator.placeholder,
              tooltip: helptext_system_certificates.acme.authenticator.tooltip,
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
  private domainList_fc: FormListConfig;

  constructor(
    protected ws: WebSocketService,
    protected loader: AppLoaderService, private dialog: MatDialog,
    protected entityFormService: EntityFormService, protected dialogService: DialogService,
    private modalService: ModalService,
  ) {
    this.getRow = this.modalService.getRow$.pipe(untilDestroyed(this)).subscribe((rowId) => {
      this.rowNum = rowId;
      this.queryCallOption = [['id', '=', rowId]];
      this.getRow.unsubscribe();
    });
  }

  preInit(entityForm: EntityFormComponent): void {
    this.ws.call('acme.dns.authenticator.query').pipe(untilDestroyed(this)).subscribe((authenticators) => {
      const listConfig = this.fieldSets[2].config[0] as FormListConfig;
      this.dns_map = _.find(listConfig.templateListField, { name: 'authenticators' }) as FormSelectConfig;
      authenticators.forEach((item) => {
        this.dns_map.options.push({ label: item.name, value: item.id });
      });
    });

    this.ws.call('certificate.acme_server_choices').pipe(untilDestroyed(this)).subscribe((choices) => {
      const acme_directory_uri = _.find(this.fieldSets[0].config, { name: 'acme_directory_uri' }) as FormSelectConfig;
      for (const key in choices) {
        acme_directory_uri.options.push({ label: choices[key], value: key });
      }
      entityForm.formGroup.controls['acme_directory_uri'].setValue(Object.keys(choices)[0]);
    });
  }

  afterInit(entityEdit: EntityFormComponent): void {
    this.entityForm = entityEdit;
    this.fieldConfig = entityEdit.fieldConfig;

    this.domainList = entityEdit.formGroup.controls['domains'] as FormArray;
    this.domainList_fc = _.find(this.fieldConfig, { name: 'domains' }) as FormListConfig;
    const listFields = this.domainList_fc.listFields;

    this.ws.call(this.queryCall, [this.queryCallOption]).pipe(untilDestroyed(this)).subscribe((res) => {
      this.commonName = res[0].common;
      this.csrOrg = res[0];

      this.ws.call('certificate.get_domain_names', [this.rowNum]).pipe(untilDestroyed(this)).subscribe((domains) => {
        if (domains && domains.length > 0) {
          for (let i = 0; i < domains.length; i++) {
            if (this.domainList.controls[i] === undefined) {
              const templateListField = _.cloneDeep(this.domainList_fc.templateListField);
              const newfg = this.entityFormService.createFormGroup(templateListField);
              newfg.setParent(this.domainList);
              this.domainList.controls.push(newfg);
              this.domainList_fc.listFields.push(templateListField);
            }

            const controls = listFields[i];
            const name_text_fc: FormParagraphConfig = _.find(controls, { name: 'name_text' });
            const auth_fc = _.find(controls, { name: 'authenticators' }) as FormSelectConfig;
            (this.domainList.controls[i] as FormGroup).controls['name_text'].setValue(domains[i]);
            name_text_fc.paraText = '<b>' + domains[i] + '</b>';
            auth_fc.options = this.dns_map.options;
          }
        }
      });
    });
  }

  customSubmit(value: any): void {
    const dns_mapping: any = { };
    value.domains.forEach((domain: any) => {
      dns_mapping[domain.name_text] = domain.authenticators;
    });

    const payload = value;
    payload['name'] = value.identifier;
    delete payload['identifier'];
    payload['csr_id'] = this.csrOrg.id;
    payload['create_type'] = 'CERTIFICATE_CREATE_ACME';
    payload['dns_mapping'] = dns_mapping;
    delete payload['domains'];
    this.dialogRef = this.dialog.open(EntityJobComponent, {
      data: {
        title: (
          helptext_system_certificates.acme.job_dialog_title),
      },
      disableClose: true,
    });
    this.dialogRef.componentInstance.setCall(this.addCall, [payload]);
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      this.dialog.closeAll();
      this.modalService.close('slide-in-form');
      this.modalService.refreshTable();
    });
    this.dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((err) => {
      this.dialog.closeAll();
      // Dialog needed b/c handleWSError doesn't open a dialog when rejection comes back from provider
      if (err.error.includes('[EFAULT')) {
        new EntityUtils().handleWSError(this.entityForm, err);
      } else {
        this.dialogService.errorReport(helptext_system_certificates.acme.error_dialog.title,
          err.exc_info.type, err.exception);
      }
    });
  }
}
