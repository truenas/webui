import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy, Component, EventEmitter, OnInit, Output,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { isObject } from 'lodash';
import {
  filter, map, of, switchMap, tap,
} from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { helptextSystemCertificates } from 'app/helptext/system/certificates';
import { Certificate } from 'app/interfaces/certificate.interface';
import { Job } from 'app/interfaces/job.interface';
import { WebSocketError } from 'app/interfaces/websocket-error.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { AsyncDataProvider } from 'app/modules/ix-table2/classes/async-data-provider/async-data-provider';
import {
  actionsColumn,
} from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { SortDirection } from 'app/modules/ix-table2/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table2/utils';
import {
  CertificateEditComponent,
} from 'app/pages/credentials/certificates-dash/certificate-edit/certificate-edit.component';
import {
  ConfirmForceDeleteCertificateComponent,
} from 'app/pages/credentials/certificates-dash/confirm-force-delete-dialog/confirm-force-delete-dialog.component';
import {
  CertificateAddComponent,
} from 'app/pages/credentials/certificates-dash/forms/certificate-add/certificate-add.component';
import { DownloadService } from 'app/services/download.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-certificate-list',
  templateUrl: './certificate-list.component.html',
  styleUrls: ['./certificate-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CertificateListComponent implements OnInit {
  @Output() certificateDeleted = new EventEmitter<void>();

  protected readonly requiredRoles = [Role.FullAdmin];

  dataProvider: AsyncDataProvider<Certificate>;
  certificates: Certificate[] = [];
  columns = createTable<Certificate>([
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
          iconName: 'block',
          tooltip: this.translate.instant('Revoked'),
          hidden: (row) => of(!row.revoked),
          onClick: () => {},
        },
        {
          iconName: 'mdi-undo',
          requiredRoles: this.requiredRoles,
          tooltip: this.translate.instant('Revoke'),
          hidden: (row) => of(!row.can_be_revoked),
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
    rowTestId: (row) => 'cert-' + row.name,
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
    const certificates$ = this.ws.call('certificate.query').pipe(
      map((certificates) => {
        return certificates
          .map((certificate) => {
            if (isObject(certificate.issuer)) {
              certificate.issuer = certificate.issuer.name;
            }
            return certificate;
          })
          .filter((certificate) => certificate.certificate !== null);
      }),
      tap((certificates) => this.certificates = certificates),
      untilDestroyed(this),
    );
    this.dataProvider = new AsyncDataProvider<Certificate>(certificates$);
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
    const slideInRef = this.slideInService.open(CertificateAddComponent);
    slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.getCertificates();
    });
  }

  doEdit(certificate: Certificate): void {
    const slideInRef = this.slideInService.open(CertificateEditComponent, {
      wide: true,
      data: certificate,
    });
    slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.getCertificates();
    });
  }

  doDelete(certificate: Certificate): void {
    this.matDialog.open(ConfirmForceDeleteCertificateComponent, { data: certificate })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap((data: { force: boolean }) => {
          return this.dialogService.jobDialog(
            this.ws.job('certificate.delete', [certificate.id, data.force]),
            { title: this.translate.instant('Deleting...') },
          ).afterClosed();
        }),
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.getCertificates();
        this.certificateDeleted.emit();
      });
  }

  doDownload(certificate: Certificate): void {
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

  doRevoke(certificate: Certificate): void {
    this.dialogService
      .confirm({
        title: this.translate.instant('Revoke Certificate'),
        message: this.translate.instant(
          'This is a one way action and cannot be reversed. Are you sure you want to revoke this Certificate?',
        ),
        buttonText: this.translate.instant('Revoke'),
        cancelText: this.translate.instant('Cancel'),
        hideCheckbox: true,
      })
      .pipe(
        filter(Boolean),
        switchMap(() => {
          return this.dialogService.jobDialog(
            this.ws.job('certificate.update', [certificate.id, { revoked: true }]),
            { title: this.translate.instant('Revoking Certificate') },
          ).afterClosed();
        }),
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.getCertificates();
      });
  }
}
