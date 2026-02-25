import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, effect, input, output, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatToolbarRow } from '@angular/material/toolbar';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { tnIconMarker } from '@truenas/ui-components';
import { filter, switchMap } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { EmptyType } from 'app/enums/empty-type.enum';
import { Role } from 'app/enums/role.enum';
import { Certificate } from 'app/interfaces/certificate.interface';
import { DialogWithSecondaryCheckboxResult } from 'app/interfaces/dialog.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { ArrayDataProvider } from 'app/modules/ix-table/classes/array-data-provider/array-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { actionsWithMenuColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions-with-menu/ix-cell-actions-with-menu.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerShowMoreComponent } from 'app/modules/ix-table/components/ix-table-pager-show-more/ix-table-pager-show-more.component';
import { IxTableCellDirective } from 'app/modules/ix-table/directives/ix-table-cell.directive';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table/utils';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  CertificateAcmeAddComponent,
} from 'app/pages/credentials/certificates-dash/certificate-acme-add/certificate-acme-add.component';
import {
  CertificateEditComponent,
} from 'app/pages/credentials/certificates-dash/certificate-edit/certificate-edit.component';
import { CsrAddComponent } from 'app/pages/credentials/certificates-dash/csr-add/csr-add.component';
import { csrListElements } from 'app/pages/credentials/certificates-dash/csr-list/csr-list.elements';
import { DownloadService } from 'app/services/download.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-csr-list',
  templateUrl: './csr-list.component.html',
  styleUrls: ['./csr-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    IxTablePagerShowMoreComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class CertificateSigningRequestsListComponent {
  private api = inject(ApiService);
  private slideIn = inject(SlideIn);
  private translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);
  protected emptyService = inject(EmptyService);
  private download = inject(DownloadService);
  private dialogService = inject(DialogService);
  private errorHandler = inject(ErrorHandlerService);
  private snackbar = inject(SnackbarService);

  readonly csrs = input<Certificate[]>([]);
  readonly isLoading = input<boolean>(false);

  readonly csrsUpdated = output();

  protected readonly requiredRoles = [Role.CertificateWrite];
  protected readonly searchableElements = csrListElements;

  dataProvider = new ArrayDataProvider<Certificate>();

  columns = createTable<Certificate>([
    textColumn({
      title: this.translate.instant('Name'),
      propertyName: 'name',
    }),
    textColumn({
      title: this.translate.instant('CN'),
      propertyName: 'common',
    }),
    actionsWithMenuColumn({
      actions: [
        {
          iconName: tnIconMarker('wrench', 'mdi'),
          tooltip: this.translate.instant('Create ACME Certificate'),
          requiredRoles: this.requiredRoles,
          onClick: (row) => this.doCreateAcmeCert(row),
        },
        {
          iconName: tnIconMarker('download', 'mdi'),
          tooltip: this.translate.instant('Download'),
          onClick: (row) => this.doDownload(row),
        },
        {
          iconName: tnIconMarker('pencil', 'mdi'),
          tooltip: this.translate.instant('Edit'),
          onClick: (row) => this.doEdit(row),
        },
        {
          iconName: tnIconMarker('delete', 'mdi'),
          requiredRoles: this.requiredRoles,
          tooltip: this.translate.instant('Delete'),
          onClick: (row) => this.doDelete(row),
        },
      ],
    }),
  ], {
    uniqueRowTag: (row) => 'csr-' + row.name,
    ariaLabels: (row) => [row.name, this.translate.instant('CSR')],
  });

  constructor() {
    this.setDefaultSort();

    effect(() => {
      const csrs = this.csrs();
      this.dataProvider.setRows(csrs);
      if (this.isLoading()) {
        this.dataProvider.setEmptyType(EmptyType.Loading);
      } else {
        this.dataProvider.setEmptyType(csrs.length ? EmptyType.NoSearchResults : EmptyType.NoPageData);
      }
    });
  }

  private setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 1,
      direction: SortDirection.Asc,
      propertyName: 'id',
    });
  }

  doAdd(): void {
    this.slideIn.open(CsrAddComponent).pipe(
      filter((response) => !!response.response),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.csrsUpdated.emit();
    });
  }

  doEdit(certificate: Certificate): void {
    this.slideIn.open(CertificateEditComponent, {
      wide: true,
      data: certificate,
    }).pipe(
      filter((response) => !!response.response),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.csrsUpdated.emit();
    });
  }

  doDelete(certificate: Certificate): void {
    this.dialogService.confirm({
      title: this.translate.instant('Delete Certificate'),
      message: this.translate.instant('Are you sure you want to delete "{name}"?', { name: certificate.name }),
      hideCheckbox: true,
      secondaryCheckbox: true,
      secondaryCheckboxText: this.translate.instant('Force'),
      buttonColor: 'warn',
      buttonText: this.translate.instant('Delete'),
    }).pipe(
      filter((confirmation: DialogWithSecondaryCheckboxResult) => confirmation.confirmed),
      switchMap((confirmation: DialogWithSecondaryCheckboxResult) => {
        const force = confirmation.secondaryCheckbox;

        const jobDialogRef = this.dialogService.jobDialog(
          this.api.job('certificate.delete', [certificate.id, force]),
          { title: this.translate.instant('Deleting...') },
        );

        return jobDialogRef.afterClosed();
      }),
      this.errorHandler.withErrorHandler(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.snackbar.success(this.translate.instant('CSR deleted'));
        this.csrsUpdated.emit();
      },
    });
  }

  doDownload(certificate: Certificate): void {
    const isCsr = certificate.cert_type_CSR;
    const path = isCsr ? certificate.csr_path : certificate.certificate_path;
    const fileName = `${certificate.name}.${isCsr ? 'csr' : 'crt'}`;

    this.download.coreDownload({
      fileName,
      method: 'filesystem.get',
      mimeType: 'application/x-x509-user-cert',
      arguments: [path],
    })
      .pipe(
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();

    this.download.coreDownload({
      method: 'filesystem.get',
      fileName: `${certificate.name}.key`,
      arguments: [certificate.privatekey_path],
      mimeType: 'text/plain',
    })
      .pipe(
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private doCreateAcmeCert(csr: Certificate): void {
    this.slideIn.open(CertificateAcmeAddComponent, { data: csr }).pipe(
      filter((response) => !!response.response),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.csrsUpdated.emit();
    });
  }
}
