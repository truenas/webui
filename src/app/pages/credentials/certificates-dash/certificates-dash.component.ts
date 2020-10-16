import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

import * as _ from 'lodash';
import { SystemGeneralService, WebSocketService, AppLoaderService, DialogService } from '../../../services/';
import { EntityFormService } from '../../common/entity/entity-form/services/entity-form.service';
import { ModalService } from '../../../services/modal.service';
import { T } from '../../../translate-marker';
import { CertificateAddComponent } from './forms/certificate-add.component';
import { CertificateEditComponent } from './forms/certificate-edit.component';
import { CertificateAuthorityAddComponent } from './forms/ca-add.component';
import { CertificateAuthorityEditComponent } from './forms/ca-edit.component';
import { CertificateAuthoritySignComponent } from './forms/ca-sign.component';
import { CertificateAcmeAddComponent } from './forms/certificate-acme-add.component';
import { AcmednsFormComponent } from './forms/acmedns-form.component';

@Component({
  selector: 'app-certificates-dash',
  templateUrl: './certificates-dash.component.html',
  providers: [EntityFormService]
})
export class CertificatesDashComponent implements OnInit {
  cards: any;
  refreshTable: Subscription;
  refreshForm: Subscription;

  protected certificateAddComponent: CertificateAddComponent;
  protected certificateEditComponent: CertificateEditComponent;
  protected certificateAuthorityAddComponent: CertificateAuthorityAddComponent;
  protected certificateAuthorityEditComponent: CertificateAuthorityEditComponent;
  protected certificateAuthoritySignComponent: CertificateAuthoritySignComponent;
  protected acmeAddComponent: CertificateAcmeAddComponent;
  protected acmeDNSComponent: AcmednsFormComponent;

  constructor(private modalService: ModalService, private router: Router, private route: ActivatedRoute,
    private ws: WebSocketService, private dialog: MatDialog, private systemGeneralService: SystemGeneralService,
    private loader: AppLoaderService, private dialogService: DialogService, private entityFormService: EntityFormService) { }

  ngOnInit(): void {
    this.getCards();
    this.refreshTable = this.modalService.refreshTable$.subscribe(() => {
      this.getCards();
    })
    this.refreshForms();
    this.refreshForm = this.modalService.refreshForm$.subscribe(() => {
      this.refreshForms();
    });
  }

  getCards() {
    this.cards = [
      {
        name: 'certificates',
        tableConf: {
          title: T('Certificates'),
          queryCall: 'certificate.query',
          deleteCall: 'certificate.delete',
          dataSourceHelper: this.certificatesDataSourceHelper,
          columns: [
            { name: T('Name'), prop: 'name'},
            { name: T('Issuer'), prop: 'issuer' },
            { name: T('From'), prop: 'from' },
            { name: T('Until'), prop: 'until' },
            { name: T('CN'), prop: 'common' },
            { name: T('SAN'), prop: 'san' }
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
          dataSourceHelper: this.csrDataSourceHelper,
          columns: [
            { name: T('Name'), prop: 'name'},
            { name: T('Issuer'), prop: 'issuer' },
            { name: T('CN'), prop: 'common' },
            { name: T('SAN'), prop: 'san' }

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
        name: 'certificate-authorities',
        tableConf: {
          title: T('Certificate Authorities'),
          queryCall: 'certificateauthority.query',
          deleteCall: 'certificateauthority.delete',
          columns: [
            { name: T('Name'), prop: 'name'},
            { name: T('Issuer'), prop: 'issuer' },
            { name: T('From'), prop: 'from' },
            { name: T('Until'), prop: 'until' },
            { name: T('CN'), prop: 'common' },
            { name: T('SAN'), prop: 'san' }
          ],
          parent: this,
          add: function() {
            this.parent.modalService.open('slide-in-form', this.parent.certificateAuthorityAddComponent);
          },
          edit: function(row) {
            this.parent.modalService.open('slide-in-form', this.parent.certificateAuthorityEditComponent, row.id);
          }
        }
      },
      {
        name: 'acme-dns',
        tableConf: {
          title: T('ACME DNS Authenticators'),
          queryCall: 'acme.dns.authenticator.query',
          deleteCall: 'acme.dns.authenticator.delete',
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
          }
        }
      }
      
    ]
  }

  certificatesDataSourceHelper(res) {
    console.log(res)
    return res.filter(item => item.certificate !== null);
  }

  csrDataSourceHelper(res) {
    return res.filter(item => item.CSR !== null);
  }

  refreshForms() {
    this.certificateAddComponent = new CertificateAddComponent(
      this.ws,this.dialog,this.systemGeneralService,this.modalService);
    this.certificateEditComponent = new CertificateEditComponent(
      this.ws,this.dialog,this.loader,this.dialogService,this.modalService);
    this.certificateAuthorityAddComponent = new CertificateAuthorityAddComponent(this.ws,this.modalService,
      this.systemGeneralService);
    this.certificateAuthorityEditComponent = new CertificateAuthorityEditComponent(this.ws,this.loader,
      this.modalService);
    this.certificateAuthoritySignComponent = new CertificateAuthoritySignComponent(this.router,this.route,
      this.ws,this.systemGeneralService);
    this.acmeAddComponent = new CertificateAcmeAddComponent(this.router,this.route,
      this.ws,this.loader,this.dialog,this.entityFormService,this.dialogService);
    this.acmeDNSComponent = new AcmednsFormComponent(this.ws,this.loader,this.dialogService,this.modalService);
  }
}
