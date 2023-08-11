import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { isObject } from 'lodash';
import {
  BehaviorSubject, Observable, combineLatest, switchMap, of, filter, map, EMPTY, catchError,
} from 'rxjs';
import { EmptyType } from 'app/enums/empty-type.enum';
import { helptextSystemCa } from 'app/helptext/system/ca';
import { helptextSystemCertificates } from 'app/helptext/system/certificates';
import { CertificateAuthority } from 'app/interfaces/certificate-authority.interface';
import { Job } from 'app/interfaces/job.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { ArrayDataProvider } from 'app/modules/ix-table2/array-data-provider';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { SortDirection } from 'app/modules/ix-table2/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table2/utils';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { CertificateAuthorityAddComponent } from 'app/pages/credentials/certificates-dash/certificate-authority-add/certificate-authority-add.component';
import { CertificateAuthorityEditComponent } from 'app/pages/credentials/certificates-dash/certificate-authority-edit/certificate-authority-edit.component';
import { SignCsrDialogComponent } from 'app/pages/credentials/certificates-dash/sign-csr-dialog/sign-csr-dialog.component';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { StorageService } from 'app/services/storage.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-certificate-authority-list',
  templateUrl: './certificate-authority-list.component.html',
  styleUrls: ['./certificate-authority-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CertificateAuthorityListComponent implements OnInit {
  filterString = '';
  dataProvider = new ArrayDataProvider<CertificateAuthority>();
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

  helptextSystemCa = helptextSystemCa;

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
      .call('certificateauthority.query')
      .pipe(
        map((authorities) => {
          return authorities.map((authority) => {
            if (isObject(authority.issuer)) {
              authority.issuer = authority.issuer.name;
            }
            return authority;
          });
        }),
        untilDestroyed(this),
      )
      .subscribe({
        next: (authorities) => {
          this.authorities = authorities;
          this.dataProvider.setRows(this.authorities);
          this.isLoading$.next(false);
          this.isNoData$.next(!this.authorities.length);
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
      this.authorities.filter((certificate) => [certificate.name.toLowerCase()].includes(this.filterString)),
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
              this.dialogService.error(this.errorHandler.parseWsError(error));
              return EMPTY;
            }),
          );
        }),
        untilDestroyed(this),
      )
      .subscribe();
  }

  doSignCsr(certificate: CertificateAuthority): void {
    const dialog = this.matDialog.open(SignCsrDialogComponent, { data: certificate.id });
    dialog
      .afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => {
        this.getCertificates();
      });
  }
}
