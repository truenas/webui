import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { isObject } from 'lodash';
import {
  BehaviorSubject, Observable, combineLatest, switchMap, of, filter, map,
} from 'rxjs';
import { EmptyType } from 'app/enums/empty-type.enum';
import { helptextSystemCertificates } from 'app/helptext/system/certificates';
import { Certificate } from 'app/interfaces/certificate.interface';
import { Job } from 'app/interfaces/job.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { ArrayDataProvider } from 'app/modules/ix-table2/array-data-provider';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { SortDirection } from 'app/modules/ix-table2/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table2/utils';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { CertificateEditComponent } from 'app/pages/credentials/certificates-dash/certificate-edit/certificate-edit.component';
import { ConfirmForceDeleteCertificateComponent } from 'app/pages/credentials/certificates-dash/confirm-force-delete-dialog/confirm-force-delete-dialog.component';
import { CertificateAddComponent } from 'app/pages/credentials/certificates-dash/forms/certificate-add/certificate-add.component';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { StorageService } from 'app/services/storage.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-certificate-list',
  templateUrl: './certificate-list.component.html',
  styleUrls: ['./certificate-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CertificateListComponent implements OnInit {
  filterString = '';
  dataProvider = new ArrayDataProvider<Certificate>();
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
    textColumn({
      propertyName: 'id',
    }),
  ]);

  isLoading$ = new BehaviorSubject<boolean>(true);
  isNoData$ = new BehaviorSubject<boolean>(false);
  hasError$ = new BehaviorSubject<boolean>(false);
  emptyType$: Observable<EmptyType> = combineLatest([this.isLoading$, this.isNoData$, this.hasError$]).pipe(
    switchMap(([isLoading, isNoData, isError]) => {
      if (isLoading) {
        return of(EmptyType.Loading);
      }
      if (isError) {
        return of(EmptyType.Errors);
      }
      if (isNoData) {
        return of(EmptyType.NoPageData);
      }
      return of(EmptyType.NoSearchResults);
    }),
  );

  constructor(
    private matDialog: MatDialog,
    private ws: WebSocketService,
    private slideInService: IxSlideInService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    protected emptyService: EmptyService,
    private storageService: StorageService,
    private dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
  ) {}

  ngOnInit(): void {
    this.getCertificates();
  }

  getCertificates(): void {
    this.ws
      .call('certificate.query')
      .pipe(
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
        untilDestroyed(this),
      )
      .subscribe({
        next: (certificates) => {
          this.certificates = certificates;
          this.dataProvider.setRows(this.certificates);
          this.isLoading$.next(false);
          this.isNoData$.next(!this.certificates.length);
          this.setDefaultSort();
          this.cdr.markForCheck();
        },
        error: () => {
          this.dataProvider.setRows([]);
          this.isLoading$.next(false);
          this.hasError$.next(true);
          this.cdr.markForCheck();
        },
      });
  }

  onListFiltered(query: string): void {
    this.filterString = query.toLowerCase();
    this.dataProvider.setRows(
      this.certificates.filter((certificate) => [certificate.name.toLowerCase()].includes(this.filterString)),
    );
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
          this.dialogService.error(this.errorHandler.parseJobError(err));
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
          this.storageService
            .streamDownloadFile(url, fileName, mimetype)
            .pipe(untilDestroyed(this))
            .subscribe({
              next: (file) => {
                this.storageService.downloadBlob(file, fileName);
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
        error: (err: WebsocketError | Job) => {
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
          this.storageService
            .streamDownloadFile(url, keyName, mimetype)
            .pipe(untilDestroyed(this))
            .subscribe({
              next: (file) => {
                this.storageService.downloadBlob(file, keyName);
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
        error: (err: WebsocketError) => {
          this.dialogService.error(this.errorHandler.parseWsError(err));
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
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => {
        const dialogRef = this.matDialog.open(EntityJobComponent, {
          data: { title: this.translate.instant('Revoking Certificate') },
        });
        dialogRef.componentInstance.setCall('certificate.update', [certificate.id, { revoked: true }]);
        dialogRef.componentInstance.submit();
        dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
          this.matDialog.closeAll();
        });
        dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((failedJob) => {
          this.matDialog.closeAll();
          this.dialogService.error(this.errorHandler.parseJobError(failedJob));
        });
      });
  }
}
