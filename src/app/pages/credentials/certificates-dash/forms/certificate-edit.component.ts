import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { helptext_system_certificates } from 'app/helptext/system/certificates';
import * as _ from 'lodash';
import { DialogService, WebSocketService, StorageService } from '../../../../services/';
import { ModalService } from 'app/services/modal.service';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { MatDialog } from '@angular/material/dialog';
import { EntityJobComponent } from '../../../common/entity/entity-job/entity-job.component';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from '../../../common/entity/entity-form/models/fieldset.interface';
import { EntityUtils } from '../../../common/entity/utils';

@Component({
  selector: 'app-certificate-edit',
  template: `<entity-form [conf]="this"></entity-form>`
})
export class CertificateEditComponent {

  protected queryCall: string = 'certificate.query';
  protected editCall = 'certificate.update';
  protected isEntity: boolean = true;
  private title = helptext_system_certificates.edit.title;
  private viewButtonText = helptext_system_certificates.viewButton.certificate;
  protected isCSR: boolean;
  protected queryCallOption: Array<any>;

  protected fieldConfig: FieldConfig[];
  public fieldSets: FieldSet[] = [
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
        validation: helptext_system_certificates.edit.name.validation
      }
    ]
  },
  {
    name: 'spacer',
    class: 'spacer',
    config:[]
  },{
    name: helptext_system_certificates.edit.subject,
    label: true,
    class: 'subject',
    config: [
      {
        type: 'paragraph',
        name: 'country',
        paraText: helptext_system_certificates.edit_view.country
      },
      {
        type: 'paragraph',
        name: 'state',
        paraText: helptext_system_certificates.edit_view.state
      },
      {
        type: 'paragraph',
        name: 'city',
        paraText: helptext_system_certificates.edit_view.city
      }
    ]
  },{
    name: 'Subject-col-2',
    class: 'subject lowerme',
    config: [
      {
        type: 'paragraph',
        name: 'organization',
        paraText: helptext_system_certificates.edit_view.organization
      },
      {
        type: 'paragraph',
        name: 'organizational_unit',
        paraText: helptext_system_certificates.edit_view.organizational_unit
      },
      {
        type: 'paragraph',
        name: 'email',
        paraText: helptext_system_certificates.edit_view.email
      }
    ]
  }, {
    name: 'subject-details',
    class: 'subject-details break-all',
    config: [
      {
        type: 'paragraph',
        name: 'common',
        paraText: helptext_system_certificates.edit_view.common
      },
      {
        type: 'paragraph',
        name: 'san',
        paraText: helptext_system_certificates.edit_view.san
      },
      {
        type: 'paragraph',
        name: 'DN',
        paraText: helptext_system_certificates.edit_view.DN
      }
    ]
  }, {
    name: 'spacer',
    class: 'spacer',
    config:[]
  },
  {
    name: 'details',
    class: 'details',
    config: [
      {
        type: 'paragraph',
        name: 'cert_type',
        paraText: helptext_system_certificates.edit_view.type
      },
      {
        type: 'paragraph',
        name: 'root_path',
        paraText: helptext_system_certificates.edit_view.path
      },
      {
        type: 'paragraph',
        name: 'digest_algorithm',
        paraText: helptext_system_certificates.edit_view.digest_algorithm
      },
      {
        type: 'paragraph',
        name: 'key_length',
        paraText: helptext_system_certificates.edit_view.key_length
      },
      {
        type: 'paragraph',
        name: 'key_type',
        paraText: helptext_system_certificates.edit_view.key_type
      },
      {
        type: 'button',
        name: 'certificate_view',
        customEventActionLabel: this.viewButtonText,
        customEventMethod: () => {
          this.viewCertificate();
        }
      }
    ]
  }, {
    name: 'Details-col2',
    class: 'details-col-2',
    config: [
      {
        type: 'paragraph',
        name: 'until',
        paraText: helptext_system_certificates.edit_view.unitl
      },
      {
        type: 'paragraph',
        name: 'issuer',
        paraText: helptext_system_certificates.edit_view.issuer
      },
      {
        type: 'paragraph',
        name: 'revoked',
        paraText: helptext_system_certificates.edit_view.revoked
      },
      {
        type: 'paragraph',
        name: 'signed_by',
        paraText: helptext_system_certificates.edit_view.signed_by
      },
      {
        type: 'paragraph',
        name: 'lifetime',
        paraText: helptext_system_certificates.edit_view.lifetime
      },
      {
        type: 'button',
        name: 'private_key_view',
        customEventActionLabel: helptext_system_certificates.viewButton.key,
        customEventMethod: () => {
          this.viewKey();
        }
      }
    ]
    }
  ];

  private rowNum: any;
  protected certificateField: any;
  protected privatekeyField: any;
  protected CSRField: any;
  protected entityForm: any;
  protected dialogRef: any;
  private getRow = new Subscription;
  private incomingData: any;

  constructor(protected ws: WebSocketService, protected matDialog: MatDialog,
    protected loader: AppLoaderService, protected dialog: DialogService,
    private modalService: ModalService, private storage: StorageService, private http: HttpClient) {
      this.getRow = this.modalService.getRow$.subscribe(rowId => {
        this.rowNum = rowId;
        this.queryCallOption = [["id", "=", rowId]];
        this.getRow.unsubscribe();
    })
  }

  resourceTransformIncomingRestData(data) {
    this.incomingData = data;
    if (data.CSR != null) {
      this.isCSR = true;
      this.title =  helptext_system_certificates.edit.titleCSR;
      this.viewButtonText = helptext_system_certificates.viewButton.csr;
    }
    this.setForm();
    return data;
  }

  protected custActions = [
    {
      id: 'create_ACME',
      name: helptext_system_certificates.list.action_create_acme_certificate,
      function: () => {
        this.modalService.close('slide-in-form');
        const message = { action: 'open', component: 'acmeComponent', row: this.rowNum };
        this.modalService.message(message);
      }
    }
  ]

  isCustActionVisible(actionname: string) {
    if (actionname === 'create_ACME' && !this.isCSR) {
      return false;
    }
    return true;
  }

  afterInit(entityEdit: any) {
    this.entityForm = entityEdit;   
  }

  setForm() {
    const fields = ['country', 'state', 'city', 'organization', 'organizational_unit', 'email', 'common', 'DN', 'cert_type',
      'root_path', 'digest_algorithm', 'key_length', 'key_type', 'until', 'revoked', 'signed_by', 'lifetime'];
    fields.forEach(field => {
      const paragraph = _.find(this.fieldConfig, { 'name': field });
      this.incomingData[field] || this.incomingData[field] === false ? 
        paragraph.paraText += this.incomingData[field] : paragraph.paraText += '---'; 
    })
    _.find(this.fieldConfig, { 'name': 'san' }).paraText += this.incomingData.san.join(',');
    const issuer = _.find(this.fieldConfig, { 'name': 'issuer' });
    if (_.isObject(this.incomingData.issuer)) {
      issuer.paraText += this.incomingData.issuer.name;
    } else {
      this.incomingData.issuer ? issuer.paraText += this.incomingData.issuer : issuer.paraText += '---';
    }
    _.find(this.fieldConfig, { 'name': 'certificate_view' }).customEventActionLabel = this.viewButtonText;

  }

  exportCertificate() {
    const path = this.incomingData.CSR ? this.incomingData.csr_path : this.incomingData.certificate_path;
    const fileName = this.incomingData.name + '.crt'; // is this right for a csr?
      this.ws.call('core.download', ['filesystem.get', [path], fileName]).subscribe(
        (res) => {
          const url = res[1];
          const mimetype = 'application/x-x509-user-cert';
          this.storage.streamDownloadFile(this.http, url, fileName, mimetype).subscribe(file => {
            this.storage.downloadBlob(file, fileName);
          }, err => {
            this.dialog.errorReport(helptext_system_certificates.list.download_error_dialog.title, 
              helptext_system_certificates.list.download_error_dialog.cert_message, `${err.status} - ${err.statusText}`);
          });
        },
        (err) => {
          new EntityUtils().handleWSError(this, err, this.dialog);
        }
      );
  }

  exportKey() {
    const fileName = this.incomingData.name + '.key';
      this.ws.call('core.download', ['filesystem.get', [this.incomingData.privatekey_path], fileName]).subscribe(
        (res) => {
          const url = res[1];
          const mimetype = 'text/plain';
          this.storage.streamDownloadFile(this.http, url, fileName, mimetype).subscribe(file => {
            this.storage.downloadBlob(file, fileName);
          }, err => {
            this.dialog.errorReport(helptext_system_certificates.list.download_error_dialog.title, 
              helptext_system_certificates.list.download_error_dialog.key_message, `${err.status} - ${err.statusText}`);
          });
        },
        (err) => {
          new EntityUtils().handleWSError(this, err, this.dialog);
        }
      );
  }

  viewCertificate() {
    if (this.incomingData.CSR) {
    this.dialog.confirm(this.incomingData.name, this.incomingData.CSR, true, 
      helptext_system_certificates.viewDialog.download, false, '',
      '','','', false, helptext_system_certificates.viewDialog.close,false, this.incomingData.CSR,true).subscribe(res => {
        if (res) {
          this.exportCertificate();
        }
      })
    } else {
      this.dialog.confirm(this.incomingData.name, this.incomingData.certificate, true, 
        helptext_system_certificates.viewDialog.download, false, '',
      '','','', false, helptext_system_certificates.viewDialog.close, false, this.incomingData.certificate,true).subscribe(res => {
        if (res) {
          this.exportCertificate();
        }
      })
    }
  }

  viewKey() {
    this.dialog.confirm(this.incomingData.name, this.incomingData.privatekey, true, 
      helptext_system_certificates.viewDialog.download, false, '',
    '','','', false, helptext_system_certificates.viewDialog.close,false,this.incomingData.privatekey,true).subscribe(res => {
      if (res) {
        this.exportKey();
      }
    })
  }

  customSubmit(value) {
    this.dialogRef = this.matDialog.open(EntityJobComponent, { data: { "title": "Updating Identifier" }});
    this.dialogRef.componentInstance.setCall(this.editCall, [this.rowNum, {'name':value['name']}]);
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.subscribe(() => {
      this.matDialog.closeAll();
      this.modalService.close('slide-in-form');
      this.modalService.refreshTable();
    });
    this.dialogRef.componentInstance.failure.subscribe((res) => {
      this.matDialog.closeAll();
      this.modalService.refreshTable();
      new EntityUtils().handleWSError(this.entityForm, res);
    });
  }
}
