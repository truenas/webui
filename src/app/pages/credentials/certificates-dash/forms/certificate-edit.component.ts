import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogRef } from '@angular/material/dialog/dialog-ref';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { helptextSystemCertificates } from 'app/helptext/system/certificates';
import { Certificate } from 'app/interfaces/certificate.interface';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { QueryFilter } from 'app/interfaces/query-api.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form/entity-form.component';
import { FieldConfig, FormButtonConfig, FormParagraphConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { EntityJobComponent } from 'app/pages/common/entity/entity-job/entity-job.component';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { DialogService, WebSocketService, StorageService } from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { ModalService } from 'app/services/modal.service';

@UntilDestroy()
@Component({
  selector: 'app-certificate-edit',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class CertificateEditComponent implements FormConfiguration {
  queryCall = 'certificate.query' as const;
  editCall = 'certificate.update' as const;
  isEntity = true;
  title: string = helptextSystemCertificates.edit.title;
  private viewButtonText: string = helptextSystemCertificates.viewButton.certificate;
  protected isCSR: boolean;
  queryCallOption: [QueryFilter<Certificate>];

  fieldConfig: FieldConfig[];
  fieldSets: FieldSet[] = [
    {
      name: helptextSystemCertificates.edit.fieldset_certificate,
      class: 'certificate',
      config: [
        {
          type: 'input',
          name: 'name',
          placeholder: helptextSystemCertificates.edit.name.placeholder,
          tooltip: helptextSystemCertificates.edit.name.tooltip,
          required: true,
          validation: helptextSystemCertificates.edit.name.validation,
        },
      ],
    },
    {
      name: 'spacer',
      class: 'spacer',
      config: [],
    }, {
      name: helptextSystemCertificates.edit.subject,
      label: true,
      class: 'subject',
      config: [
        {
          type: 'paragraph',
          name: 'country',
          paraText: helptextSystemCertificates.edit_view.country,
        },
        {
          type: 'paragraph',
          name: 'state',
          paraText: helptextSystemCertificates.edit_view.state,
        },
        {
          type: 'paragraph',
          name: 'city',
          paraText: helptextSystemCertificates.edit_view.city,
        },
      ],
    }, {
      name: 'Subject-col-2',
      class: 'subject lowerme',
      config: [
        {
          type: 'paragraph',
          name: 'organization',
          paraText: helptextSystemCertificates.edit_view.organization,
        },
        {
          type: 'paragraph',
          name: 'organizational_unit',
          paraText: helptextSystemCertificates.edit_view.organizational_unit,
        },
        {
          type: 'paragraph',
          name: 'email',
          paraText: helptextSystemCertificates.edit_view.email,
        },
      ],
    }, {
      name: 'subject-details',
      class: 'subject-details break-all',
      config: [
        {
          type: 'paragraph',
          name: 'common',
          paraText: helptextSystemCertificates.edit_view.common,
        },
        {
          type: 'paragraph',
          name: 'san',
          paraText: helptextSystemCertificates.edit_view.san,
        },
        {
          type: 'paragraph',
          name: 'DN',
          paraText: helptextSystemCertificates.edit_view.DN,
        },
      ],
    }, {
      name: 'spacer',
      class: 'spacer',
      config: [],
    },
    {
      name: 'details',
      class: 'details',
      config: [
        {
          type: 'paragraph',
          name: 'cert_type',
          paraText: helptextSystemCertificates.edit_view.type,
        },
        {
          type: 'paragraph',
          name: 'root_path',
          paraText: helptextSystemCertificates.edit_view.path,
        },
        {
          type: 'paragraph',
          name: 'digest_algorithm',
          paraText: helptextSystemCertificates.edit_view.digest_algorithm,
        },
        {
          type: 'paragraph',
          name: 'key_length',
          paraText: helptextSystemCertificates.edit_view.key_length,
        },
        {
          type: 'paragraph',
          name: 'key_type',
          paraText: helptextSystemCertificates.edit_view.key_type,
        },
        {
          type: 'button',
          name: 'certificate_view',
          customEventActionLabel: this.viewButtonText,
          customEventMethod: () => {
            this.viewCertificate();
          },
        },
      ],
    }, {
      name: 'Details-col2',
      class: 'details-col-2',
      config: [
        {
          type: 'paragraph',
          name: 'until',
          paraText: helptextSystemCertificates.edit_view.unitl,
        },
        {
          type: 'paragraph',
          name: 'issuer',
          paraText: helptextSystemCertificates.edit_view.issuer,
        },
        {
          type: 'paragraph',
          name: 'revoked',
          paraText: helptextSystemCertificates.edit_view.revoked,
        },
        {
          type: 'paragraph',
          name: 'signedby',
          paraText: helptextSystemCertificates.edit_view.signed_by,
        },
        {
          type: 'paragraph',
          name: 'lifetime',
          paraText: helptextSystemCertificates.edit_view.lifetime,
        },
        {
          type: 'button',
          name: 'private_key_view',
          customEventActionLabel: helptextSystemCertificates.viewButton.key,
          customEventMethod: () => {
            this.viewKey();
          },
        },
      ],
    },
  ];

  private rowNum: number;
  protected entityForm: EntityFormComponent;
  protected dialogRef: MatDialogRef<EntityJobComponent>;
  private getRow = new Subscription();
  private incomingData: Certificate;

  constructor(protected ws: WebSocketService, protected matDialog: MatDialog,
    protected loader: AppLoaderService, protected dialog: DialogService,
    private modalService: ModalService, private storage: StorageService, private http: HttpClient) {
    this.getRow = this.modalService.getRow$.pipe(untilDestroyed(this)).subscribe((rowId: number) => {
      this.rowNum = rowId;
      this.queryCallOption = [['id', '=', rowId]];
      this.getRow.unsubscribe();
    });
  }

  resourceTransformIncomingRestData(data: Certificate): Certificate {
    this.incomingData = data;
    if (data.cert_type_CSR) {
      this.isCSR = true;
      this.title = helptextSystemCertificates.edit.titleCSR;
      this.viewButtonText = helptextSystemCertificates.viewButton.csr;
    }
    this.setForm();
    return data;
  }

  custActions = [
    {
      id: 'create_ACME',
      name: helptextSystemCertificates.list.action_create_acme_certificate,
      function: () => {
        this.modalService.closeSlideIn();
        const message = { action: 'open', component: 'acmeComponent', row: this.rowNum };
        this.modalService.message(message);
      },
    },
  ];

  isCustActionVisible(actionname: string): boolean {
    if (actionname === 'create_ACME' && !this.isCSR) {
      return false;
    }
    return true;
  }

  afterInit(entityEdit: EntityFormComponent): void {
    this.entityForm = entityEdit;
  }

  setForm(): void {
    const fields: (keyof Certificate)[] = [
      'country', 'state', 'city', 'organization', 'organizational_unit', 'email', 'common', 'DN', 'cert_type',
      'root_path', 'digest_algorithm', 'key_length', 'key_type', 'until', 'revoked', 'lifetime',
    ];
    fields.forEach((field) => {
      const paragraph: FormParagraphConfig = _.find(this.fieldConfig, { name: field });
      if (this.incomingData[field] || this.incomingData[field] === false) {
        paragraph.paraText += this.incomingData[field];
      } else {
        paragraph.paraText += '---';
      }
    });
    const sanConfig: FormParagraphConfig = _.find(this.fieldConfig, { name: 'san' });
    sanConfig.paraText += this.incomingData.san.join(',');

    const signedbyConfig: FormParagraphConfig = _.find(this.fieldConfig, { name: 'signedby' });
    signedbyConfig.paraText += this.incomingData.signedby?.name || '---';

    const issuer: FormParagraphConfig = _.find(this.fieldConfig, { name: 'issuer' });
    if (_.isObject(this.incomingData.issuer)) {
      issuer.paraText += (this.incomingData.issuer as any).name;
    } else if (this.incomingData.issuer) {
      issuer.paraText += this.incomingData.issuer;
    } else {
      issuer.paraText += '---';
    }
    const certButton = _.find(this.fieldConfig, { name: 'certificate_view' }) as FormButtonConfig;
    certButton.customEventActionLabel = this.viewButtonText;
  }

  exportCertificate(): void {
    const path = this.incomingData.CSR ? this.incomingData.csr_path : this.incomingData.certificate_path;
    const fileName = this.incomingData.name + '.crt'; // is this right for a csr?
    this.ws.call('core.download', ['filesystem.get', [path], fileName]).pipe(untilDestroyed(this)).subscribe(
      (res) => {
        const url = res[1];
        const mimetype = 'application/x-x509-user-cert';
        this.storage.streamDownloadFile(this.http, url, fileName, mimetype)
          .pipe(untilDestroyed(this))
          .subscribe((file) => {
            this.storage.downloadBlob(file, fileName);
          }, (err) => {
            this.dialog.errorReport(helptextSystemCertificates.list.download_error_dialog.title,
              helptextSystemCertificates.list.download_error_dialog.cert_message, `${err.status} - ${err.statusText}`);
          });
      },
      (err) => {
        new EntityUtils().handleWSError(this, err, this.dialog);
      },
    );
  }

  exportKey(): void {
    const fileName = this.incomingData.name + '.key';
    this.ws.call('core.download', ['filesystem.get', [this.incomingData.privatekey_path], fileName]).pipe(untilDestroyed(this)).subscribe(
      (res) => {
        const url = res[1];
        const mimetype = 'text/plain';
        this.storage.streamDownloadFile(this.http, url, fileName, mimetype)
          .pipe(untilDestroyed(this))
          .subscribe((file) => {
            this.storage.downloadBlob(file, fileName);
          }, (err) => {
            this.dialog.errorReport(helptextSystemCertificates.list.download_error_dialog.title,
              helptextSystemCertificates.list.download_error_dialog.key_message, `${err.status} - ${err.statusText}`);
          });
      },
      (err) => {
        new EntityUtils().handleWSError(this, err, this.dialog);
      },
    );
  }

  viewCertificate(): void {
    if (this.incomingData.CSR) {
      this.dialog.confirm({
        title: this.incomingData.name,
        message: this.incomingData.CSR,
        hideCheckBox: true,
        buttonMsg: helptextSystemCertificates.viewDialog.download,
        cancelMsg: helptextSystemCertificates.viewDialog.close,
        textToCopy: this.incomingData.CSR,
        keyTextArea: true,
      }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
        this.exportCertificate();
      });
    } else {
      this.dialog.confirm({
        title: this.incomingData.name,
        message: this.incomingData.certificate,
        hideCheckBox: true,
        buttonMsg: helptextSystemCertificates.viewDialog.download,
        cancelMsg: helptextSystemCertificates.viewDialog.close,
        textToCopy: this.incomingData.certificate,
        keyTextArea: true,
      }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
        this.exportCertificate();
      });
    }
  }

  viewKey(): void {
    this.dialog.confirm({
      title: this.incomingData.name,
      message: this.incomingData.privatekey,
      hideCheckBox: true,
      buttonMsg: helptextSystemCertificates.viewDialog.download,
      cancelMsg: helptextSystemCertificates.viewDialog.close,
      textToCopy: this.incomingData.privatekey,
      keyTextArea: true,
    }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.exportKey();
    });
  }

  customSubmit(value: { name: string }): void {
    this.dialogRef = this.matDialog.open(EntityJobComponent, { data: { title: 'Updating Identifier' } });
    this.dialogRef.componentInstance.setCall(this.editCall, [this.rowNum, { name: value['name'] }]);
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      this.matDialog.closeAll();
      this.modalService.closeSlideIn();
      this.modalService.refreshTable();
    });
    this.dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((res) => {
      this.matDialog.closeAll();
      this.modalService.refreshTable();
      new EntityUtils().handleWSError(this.entityForm, res);
    });
  }
}
