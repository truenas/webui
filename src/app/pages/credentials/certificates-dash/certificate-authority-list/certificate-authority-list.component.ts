import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, OnInit,
  output,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatToolbarRow } from '@angular/material/toolbar';
import { MatTooltip } from '@angular/material/tooltip';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { isObject } from 'lodash-es';
import {
  catchError, EMPTY, filter, map, of, switchMap, tap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { helptextSystemCa } from 'app/helptext/system/ca';
import { CertificateAuthority } from 'app/interfaces/certificate-authority.interface';
import { FormatDateTimePipe } from 'app/modules/dates/pipes/format-date-time/format-datetime.pipe';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import {
  actionsColumn,
} from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerShowMoreComponent } from 'app/modules/ix-table/components/ix-table-pager-show-more/ix-table-pager-show-more.component';
import { IxTableCellDirective } from 'app/modules/ix-table/directives/ix-table-cell.directive';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table/utils';
import { TestDirective } from 'app/modules/test-id/test.directive';
import {
  CertificateAuthorityAddComponent,
} from 'app/pages/credentials/certificates-dash/certificate-authority-add/certificate-authority-add.component';
import {
  CertificateAuthorityEditComponent,
} from 'app/pages/credentials/certificates-dash/certificate-authority-edit/certificate-authority-edit.component';
import { certificateAuthorityListElements } from 'app/pages/credentials/certificates-dash/certificate-authority-list/certificate-authority-list.elements';
import {
  SignCsrDialogComponent,
} from 'app/pages/credentials/certificates-dash/sign-csr-dialog/sign-csr-dialog.component';
import { DownloadService } from 'app/services/download.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { SlideInService } from 'app/services/slide-in.service';
import { ApiService } from 'app/services/websocket/api.service';

@UntilDestroy()
@Component({
  selector: 'ix-certificate-authority-list',
  templateUrl: './certificate-authority-list.component.html',
  styleUrls: ['./certificate-authority-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    UiSearchDirective,
    MatToolbarRow,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    MatCardContent,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTableCellDirective,
    IxIconComponent,
    MatTooltip,
    IxTablePagerShowMoreComponent,
    TranslateModule,
    FormatDateTimePipe,
    AsyncPipe,
  ],
})
export class CertificateAuthorityListComponent implements OnInit {
  readonly certificateSigned = output();

  protected readonly requiredRoles = [Role.FullAdmin];
  protected readonly searchableElements = certificateAuthorityListElements;

  dataProvider: AsyncDataProvider<CertificateAuthority>;
  authorities: CertificateAuthority[] = [];
  columns = createTable<CertificateAuthority>([
    textColumn({
      title: this.translate.instant('Name'),
      propertyName: 'name',
    }),
    textColumn({
      title: this.translate.instant('Date'),
      propertyName: 'from',
    }),
    textColumn({
      title: this.translate.instant('CN'),
      propertyName: 'common',
    }),
    actionsColumn({
      actions: [
        {
          iconName: iconMarker('beenhere'),
          tooltip: this.translate.instant('Sign CSR'),
          requiredRoles: this.requiredRoles,
          onClick: (row) => this.doSignCsr(row),
        },
        {
          iconName: iconMarker('mdi-undo'),
          tooltip: this.translate.instant('Revoke'),
          requiredRoles: this.requiredRoles,
          hidden: (row) => of(row.revoked),
          onClick: (row) => this.doRevoke(row),
        },
        {
          iconName: iconMarker('mdi-download'),
          tooltip: this.translate.instant('Download'),
          onClick: (row) => this.doDownload(row),
        },
        {
          iconName: iconMarker('edit'),
          tooltip: this.translate.instant('Edit'),
          onClick: (row) => this.doEdit(row),
        },
        {
          iconName: iconMarker('mdi-delete'),
          requiredRoles: this.requiredRoles,
          tooltip: this.translate.instant('Delete'),
          onClick: (row) => this.doDelete(row),
        },
      ],
    }),
  ], {
    uniqueRowTag: (row) => 'ca-' + row.name,
    ariaLabels: (row) => [row.name, this.translate.instant('Certificate Authority')],
  });

  constructor(
    private matDialog: MatDialog,
    private api: ApiService,
    private slideInService: SlideInService,
    private translate: TranslateService,
    protected emptyService: EmptyService,
    private download: DownloadService,
    private dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
  ) {}

  ngOnInit(): void {
    const authorities$ = this.api.call('certificateauthority.query').pipe(
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
          switchMap(() => this.api.call('certificateauthority.delete', [authority.id])),
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
    this.api
      .call('core.download', ['filesystem.get', [path], fileName])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: ([, url]) => {
          const mimetype = 'application/x-x509-user-cert';
          this.download
            .streamDownloadFile(url, fileName, mimetype)
            .pipe(
              this.errorHandler.catchError(),
              untilDestroyed(this),
            )
            .subscribe((file) => {
              this.download.downloadBlob(file, fileName);
            });
        },
        error: (err: unknown) => {
          this.dialogService.error(this.errorHandler.parseError(err));
        },
      });
    const keyName = `${certificate.name}.key`;
    this.api
      .call('core.download', ['filesystem.get', [certificate.privatekey_path], keyName])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: ([, url]) => {
          const mimetype = 'text/plain';
          this.download
            .streamDownloadFile(url, keyName, mimetype)
            .pipe(
              this.errorHandler.catchError(),
              untilDestroyed(this),
            )
            .subscribe((file) => {
              this.download.downloadBlob(file, keyName);
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
          return this.api.call('certificateauthority.update', [certificate.id, { revoked: true }]).pipe(
            catchError((error: unknown) => {
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
