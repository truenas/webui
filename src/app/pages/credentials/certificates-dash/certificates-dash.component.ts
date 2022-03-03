import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { filter } from 'rxjs/operators';
import { helptextSystemCa } from 'app/helptext/system/ca';
import { helptextSystemCertificates } from 'app/helptext/system/certificates';
import { CertificateAuthority } from 'app/interfaces/certificate-authority.interface';
import { Certificate } from 'app/interfaces/certificate.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { DialogFormConfiguration } from 'app/modules/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/modules/entity/entity-dialog/entity-dialog.component';
import { FieldConfig, FormSelectConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { EntityFormService } from 'app/modules/entity/entity-form/services/entity-form.service';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { AppTableAction, AppTableConfig, TableComponent } from 'app/modules/entity/table/table.component';
import { TableService } from 'app/modules/entity/table/table.service';
import { EntityUtils } from 'app/modules/entity/utils';
import { AcmednsFormComponent } from 'app/pages/credentials/certificates-dash/forms/acmedns-form.component';
import {
  SystemGeneralService, WebSocketService, DialogService, StorageService, ModalServiceMessage,
} from 'app/services';
import { ModalService } from 'app/services/modal.service';
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
    private translate: TranslateService,
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
        this.unsignedCsrSelectField.options.push(
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
          title: this.translate.instant('Certificates'),
          queryCall: 'certificate.query',
          deleteCall: 'certificate.delete',
          deleteCallIsJob: true,
          complex: true,
          dataSourceHelper: this.certificatesDataSourceHelper,
          getActions: this.certificateActions.bind(this),
          isActionVisible: (actionId: string, certificate: Certificate) => {
            if (actionId === 'revoke') {
              return certificate.can_be_revoked;
            }
            return true;
          },
          columns: [
            {
              name: this.translate.instant('Name'), prop1: 'name', name2: this.translate.instant('Issuer'), prop2: 'issuer',
            },
            {
              name: this.translate.instant('From'), prop1: 'from', name2: this.translate.instant('Until'), prop2: 'until',
            },
            {
              name: this.translate.instant('CN'), prop1: 'common', name2: this.translate.instant('SAN'), prop2: 'san',
            },
            {
              name: this.translate.instant('Status'),
              prop1: 'revoked',
              iconTooltip: this.translate.instant('Revoked'),
              getIcon: (element: Certificate, prop: keyof Certificate): string => {
                if (element[prop]) {
                  return 'block';
                }
                return '';
              },
            },
          ],
          parent: this,
          add: () => {
            this.modalService.openInSlideIn(CertificateAddComponent);
          },
          edit: (row: Certificate) => {
            this.modalService.openInSlideIn(CertificateEditComponent, row.id);
          },
        },
      },
      {
        name: 'CSRs',
        tableConf: {
          title: this.translate.instant('Certificate Signing Requests'),
          queryCall: 'certificate.query',
          deleteCall: 'certificate.delete',
          deleteCallIsJob: true,
          complex: true,
          dataSourceHelper: this.csrDataSourceHelper,
          getActions: this.csrActions.bind(this),
          columns: [
            {
              name: this.translate.instant('Name'), prop1: 'name', name2: this.translate.instant('Issuer'), prop2: 'issuer',
            },
            {
              name: this.translate.instant('CN'), prop1: 'common', name2: this.translate.instant('SAN'), prop2: 'san',
            },
          ],
          parent: this,
          add: () => {
            this.modalService.openInSlideIn(CertificateAddComponent, 'csr');
          },
          edit: (row: Certificate) => {
            this.modalService.openInSlideIn(CertificateEditComponent, row.id);
          },
        },
      },
      {
        name: 'certificate-authorities',
        tableConf: {
          title: this.translate.instant('Certificate Authorities'),
          queryCall: 'certificateauthority.query',
          deleteCall: 'certificateauthority.delete',
          complex: true,
          dataSourceHelper: this.caDataSourceHelper,
          getActions: this.caActions.bind(this),
          columns: [
            {
              name: this.translate.instant('Name'), prop1: 'name', name2: this.translate.instant('Issuer'), prop2: 'issuer',
            },
            {
              name: this.translate.instant('From'), prop1: 'from', name2: this.translate.instant('Until'), prop2: 'until',
            },
            {
              name: this.translate.instant('CN'), prop1: 'common', name2: this.translate.instant('SAN'), prop2: 'san',
            },
            {
              name: this.translate.instant('Status'),
              prop1: 'revoked',
              iconTooltip: this.translate.instant('Revoked'),
              getIcon: (element: Certificate, prop: keyof Certificate): string => {
                if (element[prop]) {
                  return 'block';
                }
                return '';
              },
            },
          ],
          parent: this,
          add: () => {
            this.modalService.openInSlideIn(CertificateAuthorityAddComponent);
          },
          edit: (row: CertificateAuthority) => {
            this.modalService.openInSlideIn(CertificateAuthorityEditComponent, row.id);
          },
          delete: (row: CertificateAuthority, table: TableComponent) => {
            if (row.signed_certificates > 0) {
              this.dialogService.confirm({
                title: helptextSystemCa.delete_error.title,
                message: helptextSystemCa.delete_error.message,
                hideCheckBox: true,
                buttonMsg: helptextSystemCa.delete_error.button,
                hideCancel: true,
              });
            } else {
              this.tableService.delete(table, row);
            }
          },
        },
      },
      {
        name: 'acme-dns',
        tableConf: {
          title: this.translate.instant('ACME DNS-Authenticators'),
          queryCall: 'acme.dns.authenticator.query',
          deleteCall: 'acme.dns.authenticator.delete',
          complex: false,
          columns: [
            { name: this.translate.instant('Name'), prop: 'name' },
            { name: this.translate.instant('Authenticator'), prop: 'authenticator' },
          ],
          parent: this,
          add: () => {
            this.modalService.openInSlideIn(AcmednsFormComponent);
          },
          edit: (row: CertificateAuthority) => {
            this.modalService.openInSlideIn(AcmednsFormComponent, row.id);
          },
        },
      },
    ];
  }

  certificatesDataSourceHelper(res: Certificate[]): Certificate[] {
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

  caDataSourceHelper(res: CertificateAuthority[]): CertificateAuthority[] {
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
        matTooltip: this.translate.instant('Download'),
        name: 'download',
        onClick: (rowinner: Certificate) => {
          const isCsr = rowinner.cert_type_CSR;
          const path = isCsr ? rowinner.csr_path : rowinner.certificate_path;
          const fileName = `${rowinner.name}.${isCsr ? 'csr' : 'crt'}`;
          this.ws.call('core.download', ['filesystem.get', [path], fileName]).pipe(untilDestroyed(this)).subscribe(
            (res) => {
              const url = res[1];
              const mimetype = 'application/x-x509-user-cert';
              this.storage.streamDownloadFile(this.http, url, fileName, mimetype)
                .pipe(untilDestroyed(this))
                .subscribe((file) => {
                  this.storage.downloadBlob(file, fileName);
                }, (err) => {
                  this.dialogService.errorReport(helptextSystemCertificates.list.download_error_dialog.title,
                    helptextSystemCertificates.list.download_error_dialog.cert_message, `${err.status} - ${err.statusText}`);
                });
            },
            (err) => {
              new EntityUtils().handleWsError(this, err, this.dialogService);
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
                  this.dialogService.errorReport(helptextSystemCertificates.list.download_error_dialog.title,
                    helptextSystemCertificates.list.download_error_dialog.key_message, `${err.status} - ${err.statusText}`);
                });
            },
            (err) => {
              new EntityUtils().handleWsError(this, err, this.dialogService);
            },
          );
        },
      },
    ];
    const revokeAction = {
      icon: 'undo',
      name: 'revoke',
      matTooltip: this.translate.instant('Revoke'),
      onClick: (rowInner: Certificate) => {
        this.dialogService.confirm({
          title: this.translate.instant('Revoke Certificate'),
          message: this.translate.instant('This is a one way action and cannot be reversed. Are you sure you want to revoke this Certificate?'),
          buttonMsg: this.translate.instant('Revoke'),
          cancelMsg: this.translate.instant('Cancel'),
          hideCheckBox: true,
        })
          .pipe(filter(Boolean), untilDestroyed(this))
          .subscribe(() => {
            this.dialogRef = this.dialog.open(EntityJobComponent, { data: { title: this.translate.instant('Revoking Certificate') } });
            this.dialogRef.componentInstance.setCall('certificate.update', [rowInner.id, { revoked: true }]);
            this.dialogRef.componentInstance.submit();
            this.dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
              this.dialog.closeAll();
            });
            this.dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((res) => {
              this.dialog.closeAll();
              new EntityUtils().handleWsError(null, res, this.dialogService);
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
      matTooltip: this.translate.instant('Create ACME Certificate'),
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
      matTooltip: helptextSystemCa.list.action_sign,
      onClick: (rowinner: CertificateAuthority) => {
        this.systemGeneralService.getUnsignedCertificates().pipe(untilDestroyed(this)).subscribe((res) => {
          this.unsignedCsrSelectField.options = [];
          res.forEach((item) => {
            this.unsignedCsrSelectField.options.push(
              { label: item.name, value: item.id },
            );
          });
          this.dialogService.dialogForm(this.signCsrFormConf);
          this.caId = rowinner.id;
        });
      },
    };

    const revokeAction = {
      icon: 'undo',
      name: 'revoke',
      matTooltip: 'Revoke',
      onClick: (rowInner: CertificateAuthority) => {
        this.dialogService.confirm({
          title: this.translate.instant('Revoke Certificate Authority'),
          message: this.translate.instant('Revoking this CA will revoke the complete CA chain. This is a one way action and cannot be reversed. Are you sure you want to revoke this CA?'),
          buttonMsg: this.translate.instant('Revoke'),
          cancelMsg: this.translate.instant('Cancel'),
          hideCheckBox: true,
        })
          .pipe(filter(Boolean), untilDestroyed(this))
          .subscribe(() => {
            this.dialogRef = this.dialog.open(EntityJobComponent, { data: { title: this.translate.instant('Revoking Certificate') } });
            this.dialogRef.componentInstance.setCall('certificateauthority.update', [rowInner.id, { revoked: true }]);
            this.dialogRef.componentInstance.submit();
            this.dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
              this.dialog.closeAll();
            });
            this.dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((res) => {
              this.dialog.closeAll();
              new EntityUtils().handleWsError(null, res, this.dialogService);
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

  private unsignedCsrSelectField: FormSelectConfig = {
    type: 'select',
    name: 'csr_cert_id',
    placeholder: helptextSystemCa.sign.csr_cert_id.placeholder,
    tooltip: helptextSystemCa.sign.csr_cert_id.tooltip,
    required: true,
    options: [],
  };

  protected signCsrFieldConf: FieldConfig[] = [
    this.unsignedCsrSelectField,
    {
      type: 'input',
      name: 'name',
      placeholder: helptextSystemCa.edit.name.placeholder,
      tooltip: helptextSystemCa.sign.name.tooltip,
    },
  ];

  signCsrFormConf: DialogFormConfiguration = {
    title: helptextSystemCa.sign.fieldset_certificate,
    fieldConfig: this.signCsrFieldConf,
    method_ws: 'certificateauthority.ca_sign_csr',
    saveButtonText: helptextSystemCa.sign.sign,
    customSubmit: (entityDialog) => this.doSignCsr(entityDialog),
  };

  doSignCsr(entityDialog: EntityDialogComponent): void {
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
      this.dialogService.errorReport(helptextSystemCa.error, err.reason, err.trace.formatted);
    });
  }
}
