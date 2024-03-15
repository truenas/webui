import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter, map, tap } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { helptextSystemCertificates } from 'app/helptext/system/certificates';
import { Certificate } from 'app/interfaces/certificate.interface';
import { Job } from 'app/interfaces/job.interface';
import { WebSocketError } from 'app/interfaces/websocket-error.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { AsyncDataProvider } from 'app/modules/ix-table2/classes/async-data-provider/async-data-provider';
import {
  actionsColumn,
} from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { SortDirection } from 'app/modules/ix-table2/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table2/utils';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import {
  CertificateAcmeAddComponent,
} from 'app/pages/credentials/certificates-dash/certificate-acme-add/certificate-acme-add.component';
import {
  CertificateEditComponent,
} from 'app/pages/credentials/certificates-dash/certificate-edit/certificate-edit.component';
import {
  ConfirmForceDeleteCertificateComponent,
} from 'app/pages/credentials/certificates-dash/confirm-force-delete-dialog/confirm-force-delete-dialog.component';
import { CsrAddComponent } from 'app/pages/credentials/certificates-dash/csr-add/csr-add.component';
import { DownloadService } from 'app/services/download.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-csr-list',
  templateUrl: './csr-list.component.html',
  styleUrls: ['./csr-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CertificateSigningRequestsListComponent implements OnInit {
  protected requiredRoles = [Role.FullAdmin];

  filterString = '';
  dataProvider: AsyncDataProvider<Certificate>;
  certificates: Certificate[] = [];
  columns = createTable<Certificate>([
    textColumn({
      title: this.translate.instant('Name'),
      propertyName: 'name',
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
          iconName: 'build',
          tooltip: this.translate.instant('Create ACME Certificate'),
          requiredRoles: this.requiredRoles,
          onClick: (row) => this.doCreateAcmeCert(row),
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
    rowTestId: (row) => 'csr-' + row.name,
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
      map((certificates) => certificates.filter((certificate) => certificate.CSR !== null)),
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
    const slideInRef = this.slideInService.open(CsrAddComponent);
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
    const dialogRef = this.matDialog.open(ConfirmForceDeleteCertificateComponent, { data: certificate });
    dialogRef
      .afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe((data: { force: boolean }) => {
        const jobDialogRef = this.matDialog.open(EntityJobComponent, {
          data: {
            title: this.translate.instant('Deleting...'),
          },
          disableClose: true,
        });
        jobDialogRef.componentInstance.setCall('certificate.delete', [certificate.id, data.force]);
        jobDialogRef.componentInstance.submit();
        jobDialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
          jobDialogRef.close(true);
          this.getCertificates();
        });
        jobDialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((err) => {
          jobDialogRef.close();
          this.dialogService.error(this.errorHandler.parseError(err));
        });
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

  doCreateAcmeCert(csr: Certificate): void {
    const slideInRef = this.slideInService.open(CertificateAcmeAddComponent, { data: csr });
    slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.getCertificates();
    });
  }
}
