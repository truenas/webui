import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { helptext_system_ca } from 'app/helptext/system/ca';
import { helptext_system_certificates } from 'app/helptext/system/certificates';
import { CertificateAuthority } from 'app/interfaces/certificate-authority.interface';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { Option } from 'app/interfaces/option.interface';
import { QueryFilter } from 'app/interfaces/query-api.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/pages/common/entity/entity-dialog/entity-dialog.component';
import { FieldConfig, FormParagraphConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { EntityUtils } from 'app/pages/common/entity/utils';
import {
  WebSocketService, AppLoaderService, StorageService, DialogService, SystemGeneralService,
} from 'app/services';
import { ModalService } from 'app/services/modal.service';

@UntilDestroy()
@Component({
  selector: 'app-ca-edit',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class CertificateAuthorityEditComponent implements FormConfiguration {
  queryCall: 'certificateauthority.query' = 'certificateauthority.query';
  editCall: 'certificateauthority.update' = 'certificateauthority.update';
  isEntity = true;
  queryCallOption: [QueryFilter<CertificateAuthority>];
  private getRow = new Subscription();
  private rowNum: any;
  title: string;
  private incomingData: CertificateAuthority;
  private unsignedCAs: Option[] = [];

  fieldConfig: FieldConfig[];
  fieldSets: FieldSet[] = [
    {
      name: helptext_system_certificates.edit.fieldset_certificate,
      class: 'certificate',
      config: [
        {
          type: 'input',
          name: 'name',
          placeholder: helptext_system_certificates.edit.name.placeholder,
          tooltip: helptext_system_certificates.edit.name.tooltip,
          required: true,
          validation: helptext_system_certificates.edit.name.validation,
        },
      ],
    },
    {
      name: 'spacer',
      class: 'spacer',
      config: [],
    }, {
      name: helptext_system_certificates.edit.subject,
      label: true,
      class: 'subject',
      config: [
        {
          type: 'paragraph',
          name: 'country',
          paraText: helptext_system_certificates.edit_view.country,
        },
        {
          type: 'paragraph',
          name: 'state',
          paraText: helptext_system_certificates.edit_view.state,
        },
        {
          type: 'paragraph',
          name: 'city',
          paraText: helptext_system_certificates.edit_view.city,
        },
      ],
    }, {
      name: 'subject-col-2',
      class: 'subject lowerme',
      config: [
        {
          type: 'paragraph',
          name: 'organization',
          paraText: helptext_system_certificates.edit_view.organization,
        },
        {
          type: 'paragraph',
          name: 'organizational_unit',
          paraText: helptext_system_certificates.edit_view.organizational_unit,
        },
        {
          type: 'paragraph',
          name: 'email',
          paraText: helptext_system_certificates.edit_view.email,
        },
      ],
    }, {
      name: 'subject_details',
      class: 'subject-details break-all',
      config: [
        {
          type: 'paragraph',
          name: 'common',
          paraText: helptext_system_certificates.edit_view.common,
        },
        {
          type: 'paragraph',
          name: 'san',
          paraText: helptext_system_certificates.edit_view.san,
        },
        {
          type: 'paragraph',
          name: 'DN',
          paraText: helptext_system_certificates.edit_view.DN,
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
          paraText: helptext_system_certificates.edit_view.type,
        },
        {
          type: 'paragraph',
          name: 'root_path',
          paraText: helptext_system_certificates.edit_view.path,
        },
        {
          type: 'paragraph',
          name: 'digest_algorithm',
          paraText: helptext_system_certificates.edit_view.digest_algorithm,
        },
        {
          type: 'paragraph',
          name: 'key_length',
          paraText: helptext_system_certificates.edit_view.key_length,
        },
        {
          type: 'paragraph',
          name: 'key_type',
          paraText: helptext_system_certificates.edit_view.key_type,
        },
        {
          type: 'button',
          name: 'certificate_view',
          customEventActionLabel: helptext_system_certificates.viewButton.certificate,
          customEventMethod: () => {
            this.viewCertificate();
          },
        },
      ],
    }, {
      name: 'details-col2',
      class: 'details-col-2',
      config: [
        {
          type: 'paragraph',
          name: 'until',
          paraText: helptext_system_certificates.edit_view.unitl,
        },
        {
          type: 'paragraph',
          name: 'issuer',
          paraText: helptext_system_certificates.edit_view.issuer,
        },
        {
          type: 'paragraph',
          name: 'revoked',
          paraText: helptext_system_certificates.edit_view.revoked,
        },
        {
          type: 'paragraph',
          name: 'signed_certificates',
          paraText: helptext_system_certificates.edit_view.signed_certificates,
        },
        {
          type: 'paragraph',
          name: 'lifetime',
          paraText: helptext_system_certificates.edit_view.lifetime,
        },
        {
          type: 'button',
          name: 'private_key_view',
          customEventActionLabel: helptext_system_certificates.viewButton.key,
          customEventMethod: () => {
            this.viewKey();
          },
        },
      ],
    },
  ];

  constructor(protected ws: WebSocketService, protected loader: AppLoaderService,
    private modalService: ModalService, private storage: StorageService, private http: HttpClient,
    private dialog: DialogService, private systemGeneralService: SystemGeneralService) {
    this.getRow = this.modalService.getRow$.pipe(untilDestroyed(this)).subscribe((rowId) => {
      this.rowNum = rowId;
      this.queryCallOption = [['id', '=', rowId]];
      this.getRow.unsubscribe();
    });
  }

  resourceTransformIncomingRestData(data: CertificateAuthority): CertificateAuthority {
    this.incomingData = data;
    this.setForm();
    return data;
  }

  signCSRFormConf: DialogFormConfiguration = {
    title: helptext_system_ca.list.action_sign,
    fieldConfig: [{
      type: 'select',
      name: 'csr_cert_id',
      placeholder: helptext_system_ca.sign.csr_cert_id.placeholder,
      tooltip: helptext_system_ca.sign.csr_cert_id.tooltip,
      required: true,
      options: this.unsignedCAs,
    },
    {
      type: 'input',
      name: 'name',
      placeholder: helptext_system_ca.sign.name.placeholder,
      tooltip: helptext_system_ca.sign.name.tooltip,
    }],
    method_ws: 'certificateauthority.ca_sign_csr',
    saveButtonText: helptext_system_ca.sign.sign,
    customSubmit: this.doSignCSR,
    parent: this,
  };

  custActions = [
    {
      id: 'sign_CSR',
      name: helptext_system_certificates.edit.signCSR,
      function: () => {
        this.systemGeneralService.getUnsignedCertificates().pipe(untilDestroyed(this)).subscribe((res) => {
          res.forEach((item) => {
            this.unsignedCAs.push(
              { label: item.name, value: item.id },
            );
          });
          this.dialog.dialogForm(this.signCSRFormConf);
        });
      },
    },
  ];

  setForm(): void {
    const fields: (keyof CertificateAuthority)[] = [
      'country', 'state', 'city', 'organization', 'organizational_unit', 'email', 'common', 'DN', 'cert_type',
      'root_path', 'digest_algorithm', 'key_length', 'key_type', 'until', 'revoked', 'signed_certificates', 'lifetime',
    ];
    fields.forEach((field) => {
      const paragraph: FormParagraphConfig = _.find(this.fieldConfig, { name: field });
      if (this.incomingData[field] || this.incomingData[field] === false) {
        paragraph.paraText += this.incomingData[field];
      } else {
        paragraph.paraText += '---';
      }
    });
    const config: FormParagraphConfig = _.find(this.fieldConfig, { name: 'san' });
    config.paraText += this.incomingData.san.join(',');
    const issuer: FormParagraphConfig = _.find(this.fieldConfig, { name: 'issuer' });
    if (_.isObject(this.incomingData.issuer)) {
      issuer.paraText += (this.incomingData.issuer as any).name;
    } else if (this.incomingData.issuer) {
      issuer.paraText += this.incomingData.issuer;
    } else {
      issuer.paraText += '---';
    }
  }

  afterInit(): void {
    this.title = helptext_system_ca.edit.title;
  }

  doSignCSR(entityDialog: EntityDialogComponent<this>): void {
    const self = entityDialog.parent;
    const payload = {
      ca_id: self.rowNum,
      csr_cert_id: entityDialog.formGroup.controls.csr_cert_id.value,
      name: entityDialog.formGroup.controls.name.value,
    };
    entityDialog.loader.open();
    entityDialog.ws.call('certificateauthority.ca_sign_csr', [payload]).pipe(untilDestroyed(this)).subscribe(() => {
      entityDialog.loader.close();
      self.dialog.closeAllDialogs();
      self.modalService.refreshTable();
    }, (err: WebsocketError) => {
      entityDialog.loader.close();
      self.dialog.errorReport(helptext_system_ca.error, err.reason, err.trace.formatted);
    });
  }

  viewCertificate(): void {
    this.dialog.confirm({
      title: this.incomingData.name,
      message: this.incomingData.certificate,
      hideCheckBox: true,
      buttonMsg: helptext_system_certificates.viewDialog.download,
      cancelMsg: helptext_system_certificates.viewDialog.close,
      textToCopy: this.incomingData.certificate,
      keyTextArea: true,
    }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.exportCertificate();
    });
  }

  exportCertificate(): void {
    const fileName = this.incomingData.name + '.crt';
    this.ws.call('core.download', ['filesystem.get', [this.incomingData.certificate_path], fileName]).pipe(untilDestroyed(this)).subscribe(
      (res) => {
        const url = res[1];
        const mimetype = 'application/x-x509-ca-cert';
        this.storage.streamDownloadFile(this.http, url, fileName, mimetype)
          .pipe(untilDestroyed(this))
          .subscribe((file) => {
            this.storage.downloadBlob(file, fileName);
          }, (err) => {
            this.dialog.errorReport(helptext_system_certificates.list.download_error_dialog.title,
              helptext_system_certificates.list.download_error_dialog.cert_message, `${err.status} - ${err.statusText}`);
          });
      },
      (err) => {
        new EntityUtils().handleWSError(this, err, this.dialog);
      },
    );
  }

  viewKey(): void {
    this.dialog.confirm({
      title: this.incomingData.name,
      message: this.incomingData.privatekey,
      hideCheckBox: true,
      buttonMsg: helptext_system_certificates.viewDialog.download,
      cancelMsg: helptext_system_certificates.viewDialog.close,
      textToCopy: this.incomingData.privatekey,
      keyTextArea: true,
    }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.exportKey();
    });
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
            this.dialog.errorReport(helptext_system_certificates.list.download_error_dialog.title,
              helptext_system_certificates.list.download_error_dialog.key_message, `${err.status} - ${err.statusText}`);
          });
      },
      (err) => {
        new EntityUtils().handleWSError(this, err, this.dialog);
      },
    );
  }

  customSubmit(value: any): void {
    const payload: any = {};
    payload['name'] = value.name;

    this.loader.open();
    this.ws.call(this.editCall, [this.rowNum, payload]).pipe(untilDestroyed(this)).subscribe(
      () => {
        this.loader.close();
        this.modalService.close('slide-in-form');
        this.modalService.refreshTable();
      },
      (res) => {
        this.loader.close();
        this.modalService.refreshTable();
        new EntityUtils().handleError(this, res);
      },
    );
  }
}
