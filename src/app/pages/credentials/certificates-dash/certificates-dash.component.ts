import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { merge } from 'rxjs';
import { filter } from 'rxjs/operators';
import { helptextSystemCa } from 'app/helptext/system/ca';
import { helptextSystemCertificates } from 'app/helptext/system/certificates';
import { CertificateAuthority } from 'app/interfaces/certificate-authority.interface';
import { Certificate } from 'app/interfaces/certificate.interface';
import { DnsAuthenticator } from 'app/interfaces/dns-authenticator.interface';
import { EntityFormService } from 'app/modules/entity/entity-form/services/entity-form.service';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { AppTableAction, AppTableConfig, TableComponent } from 'app/modules/entity/table/table.component';
import { TableService } from 'app/modules/entity/table/table.service';
import { EntityUtils } from 'app/modules/entity/utils';
import {
  CertificateAcmeAddComponent,
} from 'app/pages/credentials/certificates-dash/certificate-acme-add/certificate-acme-add.component';
import {
  CertificateAuthorityEditComponent,
} from 'app/pages/credentials/certificates-dash/certificate-authority-edit/certificate-authority-edit.component';
import { ConfirmForceDeleteCertificateComponent } from 'app/pages/credentials/certificates-dash/confirm-force-delete-dialog/confirm-force-delete-dialog.component';
import { AcmednsFormComponent } from 'app/pages/credentials/certificates-dash/forms/acmedns-form/acmedns-form.component';
import { SignCsrDialogComponent } from 'app/pages/credentials/certificates-dash/sign-csr-dialog/sign-csr-dialog.component';
import { WebSocketService, DialogService, StorageService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { ModalService } from 'app/services/modal.service';
import { CertificateEditComponent } from './certificate-edit/certificate-edit.component';
import { CertificateAuthorityAddComponent } from './forms/ca-add.component';
import { CertificateAddComponent } from './forms/certificate-add.component';

@UntilDestroy()
@Component({
  templateUrl: './certificates-dash.component.html',
  providers: [EntityFormService],
})
export class CertificatesDashComponent implements OnInit {
  cards: { name: string; tableConf: AppTableConfig<CertificatesDashComponent> }[];
  protected dialogRef: MatDialogRef<EntityJobComponent>;
  private downloadActions: AppTableAction[];

  constructor(
    private modalService: ModalService,
    private slideInService: IxSlideInService,
    private ws: WebSocketService,
    private dialog: MatDialog,
    private dialogService: DialogService,
    private storage: StorageService,
    private tableService: TableService,
    private translate: TranslateService,
  ) { }

  ngOnInit(): void {
    this.getCards();
    merge(
      this.slideInService.onClose$,
      this.modalService.refreshTable$,
    )
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.getCards();
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
          edit: (certificate: Certificate) => {
            const slideIn = this.slideInService.open(CertificateEditComponent, { wide: true });
            slideIn.setCertificate(certificate);
          },
          delete: (item: Certificate, table: TableComponent) => {
            const dialogRef = this.dialog.open(ConfirmForceDeleteCertificateComponent, { data: { cert: item } });
            dialogRef.afterClosed()
              .pipe(untilDestroyed(this))
              .subscribe((result: unknown) => {
                if (!result) {
                  return;
                }
                this.dialogRef = this.dialog.open(EntityJobComponent, { data: { title: this.translate.instant('Deleting...') } });
                this.dialogRef.componentInstance.setCall(
                  table.tableConf.deleteCall,
                  [item.id, (result as { force: boolean }).force],
                );
                this.dialogRef.componentInstance.submit();
                this.dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
                  this.dialogRef.close(true);
                  this.tableService.getData(table);
                });
                this.dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((err) => {
                  table.loaderOpen = false;
                  new EntityUtils().handleWsError(this, err, this.dialogService);
                });
              });
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
          edit: (certificate: Certificate) => {
            const slideIn = this.slideInService.open(CertificateEditComponent, { wide: true });
            slideIn.setCertificate(certificate);
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
            const form = this.slideInService.open(CertificateAuthorityEditComponent, { wide: true });
            form.setCertificateAuthority(row);
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
            this.slideInService.open(AcmednsFormComponent);
          },
          edit: (row: DnsAuthenticator) => {
            const form = this.slideInService.open(AcmednsFormComponent);
            form.setAcmednsForEdit(row);
          },
        },
      },
    ];
  }

  certificatesDataSourceHelper(certificates: Certificate[]): Certificate[] {
    certificates.forEach((certificate) => {
      if (_.isObject(certificate.issuer)) {
        certificate.issuer = certificate.issuer.name;
      }
    });
    return certificates.filter((item) => item.certificate !== null);
  }

  csrDataSourceHelper(certificates: Certificate[]): Certificate[] {
    return certificates.filter((item) => item.CSR !== null);
  }

  caDataSourceHelper(authorities: CertificateAuthority[]): CertificateAuthority[] {
    authorities.forEach((row) => {
      if (_.isObject(row.issuer)) {
        row.issuer = row.issuer.name;
      }
    });
    return authorities;
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
          this.ws.call('core.download', ['filesystem.get', [path], fileName]).pipe(untilDestroyed(this)).subscribe({
            next: ([, url]) => {
              const mimetype = 'application/x-x509-user-cert';
              this.storage.streamDownloadFile(url, fileName, mimetype)
                .pipe(untilDestroyed(this))
                .subscribe({
                  next: (file) => {
                    this.storage.downloadBlob(file, fileName);
                  },
                  error: (err) => {
                    this.dialogService.errorReport(helptextSystemCertificates.list.download_error_dialog.title,
                      helptextSystemCertificates.list.download_error_dialog.cert_message, `${err.status} - ${err.statusText}`);
                  },
                });
            },
            error: (err) => {
              new EntityUtils().handleWsError(this, err, this.dialogService);
            },
          });
          const keyName = rowinner.name + '.key';
          this.ws.call('core.download', ['filesystem.get', [rowinner.privatekey_path], keyName]).pipe(untilDestroyed(this)).subscribe({
            next: ([, url]) => {
              const mimetype = 'text/plain';
              this.storage.streamDownloadFile(url, keyName, mimetype)
                .pipe(untilDestroyed(this))
                .subscribe({
                  next: (file) => {
                    this.storage.downloadBlob(file, keyName);
                  },
                  error: (err) => {
                    this.dialogService.errorReport(helptextSystemCertificates.list.download_error_dialog.title,
                      helptextSystemCertificates.list.download_error_dialog.key_message, `${err.status} - ${err.statusText}`);
                  },
                });
            },
            error: (err) => {
              new EntityUtils().handleWsError(this, err, this.dialogService);
            },
          });
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
            this.dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((failedJob) => {
              this.dialog.closeAll();
              new EntityUtils().handleWsError(this, failedJob, this.dialogService);
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
      onClick: (csr: Certificate) => {
        const acmeForm = this.slideInService.open(CertificateAcmeAddComponent);
        acmeForm.setCsr(csr);
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
        const dialog = this.dialog.open(SignCsrDialogComponent, {
          data: rowinner.id,
        });
        dialog.afterClosed().pipe(untilDestroyed(this)).subscribe(() => {
          this.getCards();
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
            this.dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((failedJob) => {
              this.dialog.closeAll();
              new EntityUtils().handleWsError(this, failedJob, this.dialogService);
            });
          });
      },
    };

    return [acmeAction, revokeAction, ...caRowActions];
  }
}
