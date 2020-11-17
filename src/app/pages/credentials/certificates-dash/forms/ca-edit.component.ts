import { Component } from '@angular/core';
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { WebSocketService, AppLoaderService, StorageService, DialogService, SystemGeneralService } from '../../../../services/';
import * as _ from 'lodash';
import { ModalService } from 'app/services/modal.service';
import { DialogFormConfiguration } from '../../../common/entity/entity-dialog/dialog-form-configuration.interface';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from '../../../common/entity/entity-form/models/fieldset.interface';
import { EntityUtils } from '../../../common/entity/utils';
import { helptext_system_ca } from 'app/helptext/system/ca';
import { helptext_system_certificates } from 'app/helptext/system/certificates';

@Component({
  selector: 'app-ca-edit',
  template: `<entity-form [conf]="this"></entity-form>`
})
export class CertificateAuthorityEditComponent {

  protected queryCall: string = 'certificateauthority.query';
  protected editCall = 'certificateauthority.update';
  protected isEntity: boolean = true;
  protected queryCallOption: Array<any>;
  private getRow = new Subscription;
  private rowNum: any;
  private title: string;
  private incomingData: any;
  private unsignedCAs = [];

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
    name: 'subject-col-2',
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
    name: 'subject_details',
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
        customEventActionLabel: helptext_system_certificates.viewButton.certificate,
        customEventMethod: () => {
          this.viewCertificate();
        }
      }
    ]
  }, {
    name: 'details-col2',
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
        name: 'signed_certificates',
        paraText: helptext_system_certificates.edit_view.signed_certificates
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

  constructor(protected ws: WebSocketService, protected loader: AppLoaderService,
    private modalService: ModalService, private storage: StorageService, private http: HttpClient,
    private dialog: DialogService, private systemGeneralService: SystemGeneralService) {
      this.getRow = this.modalService.getRow$.subscribe(rowId => {
        this.rowNum = rowId;
        this.queryCallOption = [["id", "=", rowId]];
        this.getRow.unsubscribe();
      })
  }

  resourceTransformIncomingRestData(data) {
    this.incomingData = data;
    this.setForm();
    return data;
  }

  public signCSRFormConf: DialogFormConfiguration = {
    title: helptext_system_ca.list.action_sign,
    fieldConfig: [{
      type: 'select',
      name: 'csr_cert_id',
      placeholder: helptext_system_ca.sign.csr_cert_id.placeholder,
      tooltip: helptext_system_ca.sign.csr_cert_id.tooltip,
      required: true,
      options: this.unsignedCAs
    },
    {
      type: 'input',
      name: 'name',
      placeholder: helptext_system_ca.sign.name.placeholder,
      tooltip: helptext_system_ca.sign.name.tooltip
    }],
    method_ws: 'certificateauthority.ca_sign_csr',
    saveButtonText: helptext_system_ca.sign.sign,
    customSubmit: this.doSignCSR,
    parent: this,
  }

  protected custActions = [
    {
      id: 'sign_CSR',
      name: helptext_system_certificates.edit.signCSR,
      function: () => {
        this.systemGeneralService.getUnsignedCertificates().subscribe( (res) => {
          res.forEach((item) => {
            this.unsignedCAs.push(
              { label : item.name, value : parseInt(item.id)}
            );
          });
          this.dialog.dialogForm(this.signCSRFormConf);
        })
      }
    }
  ]

  setForm() {
    const fields = ['country', 'state', 'city', 'organization', 'organizational_unit', 'email', 'common', 'DN', 'cert_type',
      'root_path', 'digest_algorithm', 'key_length', 'key_type', 'until', 'revoked', 'signed_certificates', 'lifetime'];
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
  }

  afterInit() {
    this.title = helptext_system_ca.edit.title;
  }

  doSignCSR(entityDialog) {
    const self = entityDialog.parent
    const payload = {
      'ca_id': self.rowNum,
      'csr_cert_id': entityDialog.formGroup.controls.csr_cert_id.value,
      'name': entityDialog.formGroup.controls.name.value
    }
    entityDialog.loader.open();
    entityDialog.ws.call('certificateauthority.ca_sign_csr', [payload]).subscribe(() => {
      entityDialog.loader.close();
      self.dialog.closeAllDialogs();
      self.modalService.refreshTable();
    }, (err) => {
      entityDialog.loader.close();
      self.dialog.errorReport(helptext_system_ca.error, err.reason, err.trace.formatted);
    })
  }

  viewCertificate() {
    this.dialog.confirm(this.incomingData.name, this.incomingData.certificate, true, 
      helptext_system_certificates.viewDialog.download, false, '',
    '','','', false, helptext_system_certificates.viewDialog.close,false,this.incomingData.certificate,true).subscribe(res => {
      if (res) {
        this.exportCertificate();
      }
    })
  }

  exportCertificate() {
    const fileName = this.incomingData.name + '.crt';
    this.ws.call('core.download', ['filesystem.get', [this.incomingData.certificate_path], fileName]).subscribe(
      (res) => {
        const url = res[1];
        const mimetype = 'application/x-x509-ca-cert';
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

  viewKey() {
    this.dialog.confirm(this.incomingData.name, this.incomingData.privatekey, true, 
      helptext_system_certificates.viewDialog.download, false, '',
    '','','', false, helptext_system_certificates.viewDialog.close,false,this.incomingData.privatekey,true).subscribe(res => {
      if (res) {
        this.exportKey();
      }
    })
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
  
  customSubmit(value) {
    let payload = {};
    payload['name'] = value.name;

    this.loader.open();
    this.ws.call(this.editCall, [this.rowNum, payload]).subscribe(
      (res) => {
        this.loader.close();
        this.modalService.close('slide-in-form');
        this.modalService.refreshTable();
      },
      (res) => {
        this.loader.close();
        this.modalService.refreshTable();
        new EntityUtils().handleError(this, res);
      }
    );
  }
}
