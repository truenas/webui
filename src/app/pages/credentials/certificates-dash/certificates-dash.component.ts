import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as _ from 'lodash';
import { filter } from 'rxjs/operators';
import { helptext_system_ca } from 'app/helptext/system/ca';
import { helptext_system_certificates } from 'app/helptext/system/certificates';
import { CertificateAuthority } from 'app/interfaces/certificate-authority.interface';
import { Certificate } from 'app/interfaces/certificate.interface';
import { Option } from 'app/interfaces/option.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/pages/common/entity/entity-dialog/entity-dialog.component';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { EntityFormService } from 'app/pages/common/entity/entity-form/services/entity-form.service';
import { EntityJobComponent } from 'app/pages/common/entity/entity-job/entity-job.component';
import { AppTableAction, AppTableConfig, TableComponent } from 'app/pages/common/entity/table/table.component';
import { TableService } from 'app/pages/common/entity/table/table.service';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { AcmednsFormComponent } from 'app/pages/credentials/certificates-dash/forms/acmedns-form.component';
import {
  SystemGeneralService, WebSocketService, DialogService, StorageService, ModalServiceMessage,
} from 'app/services';
import { ModalService } from 'app/services/modal.service';
import { T } from 'app/translate-marker';
import { CertificateAuthorityAddComponent } from './forms/ca-add.component';
import { CertificateAuthorityEditComponent } from './forms/ca-edit.component';
import { CertificateAcmeAddComponent } from './forms/certificate-acme-add.component';
import { CertificateAddComponent } from './forms/certificate-add.component';
import { CertificateEditComponent } from './forms/certificate-edit.component';

@UntilDestroy()
@Component({
  selector: 'app-certificates-dash',
  templateUrl: './certificates-dash.component.html',
  providers: [EntityFormService],
})
export class CertificatesDashComponent implements OnInit {
  cards: { name: string; tableConf: AppTableConfig<CertificatesDashComponent> }[];
  protected dialogRef: MatDialogRef<EntityJobComponent>;
  private downloadActions: AppTableAction[];
  private unsignedCAs: Option[] = [];
  private caId: number;

  constructor(
    private modalService: ModalService,
    private ws: WebSocketService,
    private dialog: MatDialog,
    private systemGeneralService: SystemGeneralService,
    private dialogService: DialogService,
    private storage: StorageService,
    private http: HttpClient,
    private tableService: TableService,
  ) { }

  ngOnInit(): void {
    this.getCards();
    this.modalService.refreshTable$.pipe(untilDestroyed(this)).subscribe(() => {
      this.getCards();
    });
    this.modalService.message$.pipe(untilDestroyed(this)).subscribe((res: ModalServiceMessage) => {
      if (res['action'] === 'open' && res['component'] === 'acmeComponent') {
        this.openForm(res['row']);
      }
    });
    this.systemGeneralService.getUnsignedCertificates().pipe(untilDestroyed(this)).subscribe((res) => {
      res.forEach((item) => {
        this.unsignedCAs.push(
          { label: item.name, value: item.id },
        );
      });
    });
  }

  getCards(): void {
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
          isActionVisible: (actionId: string, certificate: any) => {
            if (actionId === 'revoke') {
              return certificate.can_be_revoked;
            }
            return true;
          },
          columns: [
            {
              name: T('Name'), prop1: 'name', name2: T('Issuer'), prop2: 'issuer',
            },
            {
              name: T('From'), prop1: 'from', name2: T('Until'), prop2: 'until',
            },
            {
              name: T('CN'), prop1: 'common', name2: T('SAN'), prop2: 'san',
            },
            {
              name: T('Status'),
              prop1: 'revoked',
              iconTooltip: T('Revoked'),
              getIcon: (element: any, prop: string): string => {
                if (element[prop]) {
                  return 'block';
                }
                return '';
              },
            },
          ],
          parent: this,
          add() {
            this.parent.modalService.openInSlideIn(CertificateAddComponent);
          },
          edit(row: Certificate) {
            this.parent.modalService.openInSlideIn(CertificateEditComponent, row.id);
          },
        },
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
            {
              name: T('Name'), prop1: 'name', name2: T('Issuer'), prop2: 'issuer',
            },
            {
              name: T('CN'), prop1: 'common', name2: T('SAN'), prop2: 'san',
            },
          ],
          parent: this,
          add() {
            this.parent.modalService.openInSlideIn(CertificateAddComponent, 'csr');
          },
          edit(row: Certificate) {
            this.parent.modalService.openInSlideIn(CertificateEditComponent, row.id);
          },
        },
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
            {
              name: T('Name'), prop1: 'name', name2: T('Issuer'), prop2: 'issuer',
            },
            {
              name: T('From'), prop1: 'from', name2: T('Until'), prop2: 'until',
            },
            {
              name: T('CN'), prop1: 'common', name2: T('SAN'), prop2: 'san',
            },
            {
              name: T('Status'),
              prop1: 'revoked',
              iconTooltip: T('Revoked'),
              getIcon: (element: any, prop: string): string => {
                if (element[prop]) {
                  return 'block';
                }
                return '';
              },
            },
          ],
          parent: this,
          add() {
            this.parent.modalService.openInSlideIn(CertificateAuthorityAddComponent);
          },
          edit(row: CertificateAuthority) {
            this.parent.modalService.openInSlideIn(CertificateAuthorityEditComponent, row.id);
          },
          delete(row: CertificateAuthority, table: TableComponent) {
            if (row.signed_certificates > 0) {
              this.parent.dialogService.confirm({
                title: helptext_system_ca.delete_error.title,
                message: helptext_system_ca.delete_error.message,
                hideCheckBox: true,
                buttonMsg: helptext_system_ca.delete_error.button,
                hideCancel: true,
              });
            } else {
              this.parent.tableService.delete(table, row);
            }
          },
        },
      },
      {
        name: 'acme-dns',
        tableConf: {
          title: T('ACME DNS-Authenticators'),
          queryCall: 'acme.dns.authenticator.query',
          deleteCall: 'acme.dns.authenticator.delete',
          complex: false,
          columns: [
            { name: T('Name'), prop: 'name' },
            { name: T('Authenticator'), prop: 'authenticator' },
          ],
          parent: this,
          add() {
            this.parent.modalService.openInSlideIn(AcmednsFormComponent);
          },
          edit(row: CertificateAuthority) {
            this.parent.modalService.openInSlideIn(AcmednsFormComponent, row.id);
          },
        },
      },
    ];
  }

  certificatesDataSourceHelper(res: any[]): any[] {
    res.forEach((certificate) => {
      if (_.isObject(certificate.issuer)) {
        certificate.issuer = certificate.issuer.name;
      }
    });
    return res.filter((item) => item.certificate !== null);
  }

  csrDataSourceHelper(res: Certificate[]): Certificate[] {
    return res.filter((item) => item.CSR !== null);
  }

  caDataSourceHelper(res: any[]): any[] {
    res.forEach((row) => {
      if (_.isObject(row.issuer)) {
        row.issuer = row.issuer.name;
      }
    });
    return res;
  }

  certificateActions(): AppTableAction[] {
    this.downloadActions = [
      {
        icon: 'save_alt',
        matTooltip: T('Download'),
        name: 'download',
        onClick: (rowinner: Certificate) => {
          const path = rowinner.CSR ? rowinner.csr_path : rowinner.certificate_path;
          const fileName = rowinner.name + '.crt'; // what about for a csr?
          this.ws.call('core.download', ['filesystem.get', [path], fileName]).pipe(untilDestroyed(this)).subscribe(
            (res) => {
              const url = res[1];
              const mimetype = 'application/x-x509-user-cert';
              this.storage.streamDownloadFile(this.http, url, fileName, mimetype)
                .pipe(untilDestroyed(this))
                .subscribe((file) => {
                  this.storage.downloadBlob(file, fileName);
                }, (err) => {
                  this.dialogService.errorReport(helptext_system_certificates.list.download_error_dialog.title,
                    helptext_system_certificates.list.download_error_dialog.cert_message, `${err.status} - ${err.statusText}`);
                });
            },
            (err) => {
              new EntityUtils().handleWSError(this, err, this.dialogService);
            },
          );
          const keyName = rowinner.name + '.key';
          this.ws.call('core.download', ['filesystem.get', [rowinner.privatekey_path], keyName]).pipe(untilDestroyed(this)).subscribe(
            (res) => {
              const url = res[1];
              const mimetype = 'text/plain';
              this.storage.streamDownloadFile(this.http, url, keyName, mimetype)
                .pipe(untilDestroyed(this))
                .subscribe((file) => {
                  this.storage.downloadBlob(file, keyName);
                }, (err) => {
                  this.dialogService.errorReport(helptext_system_certificates.list.download_error_dialog.title,
                    helptext_system_certificates.list.download_error_dialog.key_message, `${err.status} - ${err.statusText}`);
                });
            },
            (err) => {
              new EntityUtils().handleWSError(this, err, this.dialogService);
            },
          );
        },
      },
    ];
    const revokeAction = {
      icon: 'undo',
      name: 'revoke',
      matTooltip: T('Revoke'),
      onClick: (rowInner: Certificate) => {
        this.dialogService.confirm({
          title: T('Revoke Certificate'),
          message: T('This is a one way action and cannot be reversed. Are you sure you want to revoke this Certificate?'),
          buttonMsg: T('Revoke'),
          cancelMsg: T('Cancel'),
          hideCheckBox: true,
        })
          .pipe(filter(Boolean), untilDestroyed(this))
          .subscribe(() => {
            this.dialogRef = this.dialog.open(EntityJobComponent, { data: { title: T('Revoking Certificate') } });
            this.dialogRef.componentInstance.setCall('certificate.update', [rowInner.id, { revoked: true }]);
            this.dialogRef.componentInstance.submit();
            this.dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
              this.dialog.closeAll();
            });
            this.dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((res) => {
              this.dialog.closeAll();
              new EntityUtils().handleWSError(null, res, this.dialogService);
            });
          });
      },
    };
    return [revokeAction, ...this.downloadActions];
  }

  csrActions(): AppTableAction<Certificate>[] {
    const csrRowActions = [...this.downloadActions];
    const acmeAction = {
      icon: 'build',
      name: 'create_ACME',
      matTooltip: T('Create ACME Certificate'),
      onClick: (rowinner: Certificate) => {
        this.modalService.openInSlideIn(CertificateAcmeAddComponent, rowinner.id);
      },
    };

    return [acmeAction, ...csrRowActions];
  }

  caActions(): AppTableAction<CertificateAuthority>[] {
    const caRowActions = [...this.downloadActions];

    const acmeAction = {
      icon: 'beenhere',
      name: 'sign_CSR',
      matTooltip: helptext_system_ca.list.action_sign,
      onClick: (rowinner: CertificateAuthority) => {
        this.dialogService.dialogForm(this.signCSRFormConf);
        this.caId = rowinner.id;
      },
    };

    const revokeAction = {
      icon: 'undo',
      name: 'revoke',
      matTooltip: 'Revoke',
      onClick: (rowInner: CertificateAuthority) => {
        this.dialogService.confirm({
          title: T('Revoke Certificate Authority'),
          message: T('Revoking this CA will revoke the complete CA chain. This is a one way action and cannot be reversed. Are you sure you want to revoke this CA?'),
          buttonMsg: T('Revoke'),
          cancelMsg: T('Cancel'),
          hideCheckBox: true,
        })
          .pipe(filter(Boolean), untilDestroyed(this))
          .subscribe(() => {
            this.dialogRef = this.dialog.open(EntityJobComponent, { data: { title: T('Revoking Certificate') } });
            this.dialogRef.componentInstance.setCall('certificateauthority.update', [rowInner.id, { revoked: true }]);
            this.dialogRef.componentInstance.submit();
            this.dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
              this.dialog.closeAll();
            });
            this.dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((res) => {
              this.dialog.closeAll();
              new EntityUtils().handleWSError(null, res, this.dialogService);
            });
          });
      },
    };

    return [acmeAction, revokeAction, ...caRowActions];
  }

  openForm(id: number): void {
    setTimeout(() => {
      this.modalService.openInSlideIn(CertificateAcmeAddComponent, id);
    }, 200);
  }

  protected signCSRFieldConf: FieldConfig[] = [
    {
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
      placeholder: helptext_system_ca.edit.name.placeholder,
      tooltip: helptext_system_ca.sign.name.tooltip,
    },
  ];

  signCSRFormConf: DialogFormConfiguration = {
    title: helptext_system_ca.sign.fieldset_certificate,
    fieldConfig: this.signCSRFieldConf,
    method_ws: 'certificateauthority.ca_sign_csr',
    saveButtonText: helptext_system_ca.sign.sign,
    customSubmit: (entityDialog) => this.doSignCSR(entityDialog),
    parent: this,
  };

  doSignCSR(entityDialog: EntityDialogComponent<this>): void {
    const payload = {
      ca_id: this.caId,
      csr_cert_id: entityDialog.formGroup.controls.csr_cert_id.value,
      name: entityDialog.formGroup.controls.name.value,
    };
    entityDialog.loader.open();
    entityDialog.ws.call('certificateauthority.ca_sign_csr', [payload]).pipe(untilDestroyed(this)).subscribe(() => {
      entityDialog.loader.close();
      this.dialogService.closeAllDialogs();
      this.getCards();
    }, (err: WebsocketError) => {
      entityDialog.loader.close();
      this.dialogService.errorReport(helptext_system_ca.error, err.reason, err.trace.formatted);
    });
  }
}
