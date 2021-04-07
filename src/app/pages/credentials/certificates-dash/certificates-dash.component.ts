import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

import { DialogFormConfiguration } from '../../common/entity/entity-dialog/dialog-form-configuration.interface';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface'

import * as _ from 'lodash';
import { SystemGeneralService, WebSocketService, AppLoaderService, DialogService, StorageService } from '../../../services/';
import { EntityFormService } from '../../common/entity/entity-form/services/entity-form.service';
import { ModalService } from '../../../services/modal.service';
import { T } from '../../../translate-marker';
import { CertificateAddComponent } from './forms/certificate-add.component';
import { CertificateEditComponent } from './forms/certificate-edit.component';
import { CertificateAuthorityAddComponent } from './forms/ca-add.component';
import { CertificateAuthorityEditComponent } from './forms/ca-edit.component';
import { CertificateAcmeAddComponent } from './forms/certificate-acme-add.component';
import { AcmednsFormComponent } from './forms/acmedns-form.component';
import { helptext_system_certificates } from 'app/helptext/system/certificates';
import { helptext_system_ca } from 'app/helptext/system/ca';
import { EntityUtils } from '../../common/entity/utils';

@Component({
  selector: 'app-certificates-dash',
  templateUrl: './certificates-dash.component.html',
  providers: [EntityFormService]
})
export class CertificatesDashComponent implements OnInit, OnDestroy {
  cards: any;
  refreshTable: Subscription;
  refreshForm: Subscription;
  message: Subscription;

  protected certificateAddComponent: CertificateAddComponent;
  protected certificateEditComponent: CertificateEditComponent;
  protected certificateAuthorityAddComponent: CertificateAuthorityAddComponent;
  protected certificateAuthorityEditComponent: CertificateAuthorityEditComponent;
  protected acmeAddComponent: CertificateAcmeAddComponent;
  protected acmeDNSComponent: AcmednsFormComponent;
  private downloadActions: any;
  private unsignedCAs = [];
  private caId: any;

  constructor(private modalService: ModalService, private router: Router, private route: ActivatedRoute,
    private ws: WebSocketService, private dialog: MatDialog, private systemGeneralService: SystemGeneralService,
    private loader: AppLoaderService, private dialogService: DialogService, private entityFormService: EntityFormService,
    private storage: StorageService, private http: HttpClient) { }

  ngOnInit(): void {
    this.getCards();
    this.refreshTable = this.modalService.refreshTable$.subscribe(() => {
      this.getCards();
    })
    this.refreshForms();
    this.refreshForm = this.modalService.refreshForm$.subscribe(() => {
      this.refreshForms();
    });
    this.message = this.modalService.message$.subscribe(res => {
      if (res['action'] === 'open' && res['component'] === 'acmeComponent')  {
        this.openForm(this.acmeAddComponent, res['row']);
      }
    })
    this.systemGeneralService.getUnsignedCertificates().subscribe( (res) => {
      res.forEach((item) => {
        this.unsignedCAs.push(
          { label : item.name, value : parseInt(item.id)}
        );
      });
    })
  }

  getCards() {
    this.cards = [
      {
        name: 'certificates',
        tableConf: {
          title: T('Certificates'),
          queryCall: 'certificate.query',
          deleteCall: 'certificate.delete',
          deleteCallIsJob: true,
          complex: true,
          dataSourceHelper: this.certificatesDataSourceHelper,
          getActions: this.certificateActions.bind(this),
          columns: [
            { name: T('Name'), prop1: 'name', name2: T('Issuer'), prop2: 'issuer'},
            { name: T('From'), prop1: 'from', name2: T('Until'), prop2: 'until' },
            { name: T('CN'), prop1: 'common', name2: T('SAN'), prop2: 'san' }
          ],
          parent: this,
          add: function() {
            this.parent.modalService.open('slide-in-form', this.parent.certificateAddComponent);
          },
          edit: function(row) {
            this.parent.modalService.open('slide-in-form', this.parent.certificateEditComponent, row.id);
          }
        }
      },
      {
        name: 'CSRs',
        tableConf: {
          title: T('Certificate Signing Requests'),
          queryCall: 'certificate.query',
          deleteCall: 'certificate.delete',
          deleteCallIsJob: true,
          complex: true,
          dataSourceHelper: this.csrDataSourceHelper,
          getActions: this.csrActions.bind(this),
          columns: [
            { name: T('Name'), prop1: 'name', name2: T('Issuer'), prop2: 'issuer' },
            { name: T('CN'), prop1: 'common', name2: T('SAN'), prop2: 'san' },
          ],
          parent: this,
          add: function() {
            this.parent.modalService.open('slide-in-form', this.parent.certificateAddComponent, 'csr');
          },
          edit: function(row) {
            this.parent.modalService.open('slide-in-form', this.parent.certificateEditComponent, row.id);
          }
        }
      },
      {
        name: 'certificate-authorities',
        tableConf: {
          title: T('Certificate Authorities'),
          queryCall: 'certificateauthority.query',
          deleteCall: 'certificateauthority.delete',
          complex: true,
          dataSourceHelper: this.caDataSourceHelper,
          getActions: this.caActions.bind(this),
          columns: [
            { name: T('Name'), prop1: 'name', name2: T('Issuer'), prop2: 'issuer'},
            { name: T('From'), prop1: 'from', name2: T('Until'), prop2: 'until' },
            { name: T('CN'), prop1: 'common', name2: T('SAN'), prop2: 'san' },
          ],
          parent: this,
          add: function() {
            this.parent.modalService.open('slide-in-form', this.parent.certificateAuthorityAddComponent);
          },
          edit: function(row) {
            this.parent.modalService.open('slide-in-form', this.parent.certificateAuthorityEditComponent, row.id);
          },
          delete: function(row, table) {
            if (row.signed_certificates > 0) {
              this.parent.dialogService.confirm(helptext_system_ca.delete_error.title, helptext_system_ca.delete_error.message,
                true, helptext_system_ca.delete_error.button, false, '', '', '', '', true)
            } else {
              table.tableService.delete(table, row);
            }
          }
        }
      },
      {
        name: 'acme-dns',
        tableConf: {
          title: T('ACME DNS-Authenticators'),
          queryCall: 'acme.dns.authenticator.query',
          deleteCall: 'acme.dns.authenticator.delete',
          complex: false,
          columns: [
            { name: T('Name'), prop: 'name'},
            { name: T('Authenticator'), prop: 'authenticator'}
          ],
          parent: this,
          add: function() {
            this.parent.modalService.open('slide-in-form', this.parent.acmeDNSComponent);
          },
          edit: function(row) {
            this.parent.modalService.open('slide-in-form', this.parent.acmeDNSComponent, row.id);
          },
        }
      }
      
    ]
  }

  certificatesDataSourceHelper(res) {
    res.forEach(certificate => {
      if(_.isObject(certificate.issuer)) {
        certificate.issuer = certificate.issuer.name;
      }
    })
    return res.filter(item => item.certificate !== null);
  }

  csrDataSourceHelper(res) {
    return res.filter(item => item.CSR !== null);
  }

  caDataSourceHelper(res) {
    res.forEach(row => {
      if (_.isObject(row.issuer)) {
        row.issuer = row.issuer.name;
      }
    })
    return res;
  }

  refreshForms() {
    this.certificateAddComponent = new CertificateAddComponent(
      this.ws,this.dialog,this.systemGeneralService,this.modalService, this.loader,this.dialogService,);
    this.certificateEditComponent = new CertificateEditComponent(
      this.ws,this.dialog,this.loader,this.dialogService,this.modalService,this.storage,this.http);
    this.certificateAuthorityAddComponent = new CertificateAuthorityAddComponent(this.ws, this.modalService, this.loader,this.dialogService, 
      this.systemGeneralService);
    this.certificateAuthorityEditComponent = new CertificateAuthorityEditComponent(this.ws,this.loader,
      this.modalService,this.storage, this.http,this.dialogService,this.systemGeneralService);
    this.acmeAddComponent = new CertificateAcmeAddComponent(this.ws,this.loader,this.dialog,
      this.entityFormService,this.dialogService,this.modalService);
    this.acmeDNSComponent = new AcmednsFormComponent(this.ws,this.loader,this.dialogService,this.modalService);
  }

certificateActions() {
    this.downloadActions = [{
      icon: 'save_alt',
      name: "download",
      
      onClick: (rowinner) => {
        const path = rowinner.CSR ? rowinner.csr_path : rowinner.certificate_path;
        const fileName = rowinner.name + '.crt'; // what about for a csr?
          this.ws.call('core.download', ['filesystem.get', [path], fileName]).subscribe(
            (res) => {
              const url = res[1];
              const mimetype = 'application/x-x509-user-cert';
              this.storage.streamDownloadFile(this.http, url, fileName, mimetype).subscribe(file => {
                this.storage.downloadBlob(file, fileName);
              }, err => {
                this.dialogService.errorReport(helptext_system_certificates.list.download_error_dialog.title, 
                  helptext_system_certificates.list.download_error_dialog.cert_message, `${err.status} - ${err.statusText}`);
              });
            },
            (err) => {
              new EntityUtils().handleWSError(this, err, this.dialog);
            }
          );
          const keyName = rowinner.name + '.key';
          this.ws.call('core.download', ['filesystem.get', [rowinner.privatekey_path], keyName]).subscribe(
            (res) => {
              const url = res[1];
              const mimetype = 'text/plain';
              this.storage.streamDownloadFile(this.http, url, keyName, mimetype).subscribe(file => {
                this.storage.downloadBlob(file, keyName);
              }, err => {
                this.dialogService.errorReport(helptext_system_certificates.list.download_error_dialog.title, 
                  helptext_system_certificates.list.download_error_dialog.key_message, `${err.status} - ${err.statusText}`);
              });
            },
            (err) => {
              new EntityUtils().handleWSError(this, err, this.dialog);
            }
          );
        event.stopPropagation();
      },
    }];
    return this.downloadActions;
  }

  csrActions() {
    let csrRowActions = [...this.downloadActions];
    const acmeAction = {
      icon: 'build',
      name: 'create_ACME',
      matTooltip: T('Create ACME Certificate'),
      onClick: (rowinner) => {
        this.modalService.open('slide-in-form', this.acmeAddComponent, rowinner.id);
        event.stopPropagation();
      }
    }
    csrRowActions.unshift(acmeAction);
    return csrRowActions;
  }

  caActions() {
    let caRowActions = [...this.downloadActions];
    const acmeAction = {
      icon: 'beenhere',
      name: 'sign_CSR',
      matTooltip: helptext_system_ca.list.action_sign,
      onClick: (rowinner) => {
        this.dialogService.dialogForm(this.signCSRFormConf);
        this.caId = rowinner.id;
        event.stopPropagation();
      }
    }
    caRowActions.unshift(acmeAction);
    return caRowActions;
  }

  openForm(component, id) {
    setTimeout(() => {
      this.modalService.open('slide-in-form', component, id);
    }, 200)
  }

  protected signCSRFieldConf: FieldConfig[] = [
    {
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
      placeholder: helptext_system_ca.edit.name.placeholder,
      tooltip: helptext_system_ca.sign.name.tooltip
    }
  ];

  public signCSRFormConf: DialogFormConfiguration = {
    title: helptext_system_ca.sign.fieldset_certificate,
    fieldConfig: this.signCSRFieldConf,
    method_ws: 'certificateauthority.ca_sign_csr',
    saveButtonText: helptext_system_ca.sign.sign,
    customSubmit: this.doSignCSR,
    parent: this,
  }

  doSignCSR(entityDialog) {
    const self = entityDialog.parent
    const payload = {
      'ca_id': self.caId,
      'csr_cert_id': entityDialog.formGroup.controls.csr_cert_id.value,
      'name': entityDialog.formGroup.controls.name.value
    }
    entityDialog.loader.open();
    entityDialog.ws.call('certificateauthority.ca_sign_csr', [payload]).subscribe(() => {
      entityDialog.loader.close();
      self.dialogService.closeAllDialogs();
      self.getCards();
    }, (err) => {
      entityDialog.loader.close();
      self.dialogService.errorReport(helptext_system_ca.error, err.reason, err.trace.formatted);
    })
  }

  ngOnDestroy() {
    this.message.unsubscribe();
    this.refreshTable.unsubscribe();
    this.refreshForm.unsubscribe();
  }

}
