import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy, Component, EventEmitter, OnInit, Output,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { isObject } from 'lodash';
import {
  catchError, EMPTY, filter, map, of, switchMap, tap,
} from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { helptextSystemCa } from 'app/helptext/system/ca';
import { helptextSystemCertificates } from 'app/helptext/system/certificates';
import { CertificateAuthority } from 'app/interfaces/certificate-authority.interface';
import { Job } from 'app/interfaces/job.interface';
import { WebSocketError } from 'app/interfaces/websocket-error.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { AsyncDataProvider } from 'app/modules/ix-table2/classes/async-data-provider/async-data-provider';
import {
  actionsColumn,
} from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { SortDirection } from 'app/modules/ix-table2/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table2/utils';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import {
  CertificateAuthorityAddComponent,
} from 'app/pages/credentials/certificates-dash/certificate-authority-add/certificate-authority-add.component';
import {
  CertificateAuthorityEditComponent,
} from 'app/pages/credentials/certificates-dash/certificate-authority-edit/certificate-authority-edit.component';
import {
  SignCsrDialogComponent,
} from 'app/pages/credentials/certificates-dash/sign-csr-dialog/sign-csr-dialog.component';
import { DownloadService } from 'app/services/download.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-certificate-authority-list',
  templateUrl: './certificate-authority-list.component.html',
  styleUrls: ['./certificate-authority-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CertificateAuthorityListComponent implements OnInit {
  @Output() certificateSigned = new EventEmitter<void>();

  protected requiredRoles = [Role.FullAdmin];

  filterString = '';
  dataProvider: AsyncDataProvider<CertificateAuthority>;
  authorities: CertificateAuthority[] = [];
  columns = createTable<CertificateAuthority>([
    textColumn({
      title: this.translate.instant('Name'),
      propertyName: 'name',
      sortable: true,
    }),
    textColumn({
      title: this.translate.instant('Date'),
      propertyName: 'from',
      sortable: true,
    }),
    textColumn({
      title: this.translate.instant('CN'),
      propertyName: 'common',
      sortable: true,
    }),
    actionsColumn({
      actions: [
        {
          iconName: 'beenhere',
          tooltip: this.translate.instant('Sign CSR'),
          requiredRoles: this.requiredRoles,
          onClick: (row) => this.doSignCsr(row),
        },
        {
          iconName: 'mdi-undo',
          tooltip: this.translate.instant('Revoke'),
          requiredRoles: this.requiredRoles,
          hidden: (row) => of(row.revoked),
          onClick: (row) => this.doRevoke(row),
        },
        {
          iconName: 'mdi-download',
          tooltip: this.translate.instant('Download'),
          onClick: (row) => this.doDownload(row),
        },
        {
          iconName: 'edit',
          tooltip: this.translate.instant('Edit'),
          onClick: (row) => this.doEdit(row),
        },
        {
          iconName: 'delete',
          requiredRoles: this.requiredRoles,
          tooltip: this.translate.instant('Delete'),
          onClick: (row) => this.doDelete(row),
        },
      ],
    }),
  ], {
    rowTestId: (row) => 'ca-' + row.name,
  });

  constructor(
    private matDialog: MatDialog,
    private ws: WebSocketService,
    private slideInService: IxSlideInService,
    private translate: TranslateService,
    protected emptyService: EmptyService,
    private download: DownloadService,
    private dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
  ) {}

  ngOnInit(): void {
    const authorities$ = this.ws.call('certificateauthority.query').pipe(
      map((authorities) => {
        return authorities.map((authority) => {
          if (isObject(authority.issuer)) {
            authority.issuer = authority.issuer.name;
          }
          return authority;
        });
      }),
      tap((authorities) => this.authorities = authorities),
      untilDestroyed(this),
    );
    this.dataProvider = new AsyncDataProvider<CertificateAuthority>(authorities$);
    this.setDefaultSort();
    this.getCertificates();
  }

  getCertificates(): void {
    this.dataProvider.load();
  }

  setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 1,
      direction: SortDirection.Asc,
      propertyName: 'id',
    });
  }

  doAdd(): void {
    const slideInRef = this.slideInService.open(CertificateAuthorityAddComponent);
    slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.getCertificates();
    });
  }

  doEdit(certificate: CertificateAuthority): void {
    const slideInRef = this.slideInService.open(CertificateAuthorityEditComponent, { wide: true, data: certificate });
    slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.getCertificates();
    });
  }

  doDelete(authority: CertificateAuthority): void {
    if (authority.signed_certificates) {
      this.dialogService.confirm({
        title: helptextSystemCa.delete_error.title,
        message: helptextSystemCa.delete_error.message,
        hideCheckbox: true,
        buttonText: helptextSystemCa.delete_error.button,
        hideCancel: true,
      });
    } else {
      this.dialogService
        .confirm({
          title: this.translate.instant('Delete Certificate Authority'),
          message: this.translate.instant('Are you sure you want to delete the <b>{name}</b> certificate authority?', {
            name: authority.name,
          }),
          buttonText: this.translate.instant('Delete'),
        })
        .pipe(
          filter(Boolean),
          switchMap(() => this.ws.call('certificateauthority.delete', [authority.id])),
          untilDestroyed(this),
        )
        .subscribe(() => {
          this.getCertificates();
        });
    }
  }

  doDownload(certificate: CertificateAuthority): void {
    const isCsr = certificate.cert_type_CSR;
    const path = isCsr ? certificate.csr_path : certificate.certificate_path;
    const fileName = `${certificate.name}.${isCsr ? 'csr' : 'crt'}`;
    this.ws
      .call('core.download', ['filesystem.get', [path], fileName])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: ([, url]) => {
          const mimetype = 'application/x-x509-user-cert';
          this.download
            .streamDownloadFile(url, fileName, mimetype)
            .pipe(untilDestroyed(this))
            .subscribe({
              next: (file) => {
                this.download.downloadBlob(file, fileName);
              },
              error: (error: HttpErrorResponse) => {
                this.dialogService.error({
                  title: helptextSystemCertificates.list.download_error_dialog.title,
                  message: helptextSystemCertificates.list.download_error_dialog.cert_message,
                  backtrace: `${error.status} - ${error.statusText}`,
                });
              },
            });
        },
        error: (err: WebSocketError | Job) => {
          this.dialogService.error(this.errorHandler.parseError(err));
        },
      });
    const keyName = `${certificate.name}.key`;
    this.ws
      .call('core.download', ['filesystem.get', [certificate.privatekey_path], keyName])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: ([, url]) => {
          const mimetype = 'text/plain';
          this.download
            .streamDownloadFile(url, keyName, mimetype)
            .pipe(untilDestroyed(this))
            .subscribe({
              next: (file) => {
                this.download.downloadBlob(file, keyName);
              },
              error: (error: HttpErrorResponse) => {
                this.dialogService.error({
                  title: helptextSystemCertificates.list.download_error_dialog.title,
                  message: helptextSystemCertificates.list.download_error_dialog.key_message,
                  backtrace: `${error.status} - ${error.statusText}`,
                });
              },
            });
        },
        error: (err: unknown) => {
          this.dialogService.error(this.errorHandler.parseError(err));
        },
      });
  }

  doRevoke(certificate: CertificateAuthority): void {
    this.dialogService
      .confirm({
        title: this.translate.instant('Revoke Certificate Authority'),
        message: this.translate.instant(
          'Revoking this CA will revoke the complete CA chain. This is a one way action and cannot be reversed. Are you sure you want to revoke this CA?',
        ),
        buttonText: this.translate.instant('Revoke'),
        cancelText: this.translate.instant('Cancel'),
        hideCheckbox: true,
      })
      .pipe(
        filter(Boolean),
        switchMap(() => {
          return this.ws.call('certificateauthority.update', [certificate.id, { revoked: true }]).pipe(
            catchError((error) => {
              this.dialogService.error(this.errorHandler.parseError(error));
              return EMPTY;
            }),
          );
        }),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.getCertificates();
      });
  }

  doSignCsr(certificate: CertificateAuthority): void {
    const dialog = this.matDialog.open(SignCsrDialogComponent, { data: certificate.id });
    dialog
      .afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => {
        this.getCertificates();
        this.certificateSigned.emit();
      });
  }
}
