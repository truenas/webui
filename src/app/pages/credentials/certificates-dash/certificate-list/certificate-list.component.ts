import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, effect, input, output, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatToolbarRow } from '@angular/material/toolbar';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { filter, switchMap } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { EmptyType } from 'app/enums/empty-type.enum';
import { Role } from 'app/enums/role.enum';
import { Certificate } from 'app/interfaces/certificate.interface';
import { DialogWithSecondaryCheckboxResult } from 'app/interfaces/dialog.interface';
import { FormatDateTimePipe } from 'app/modules/dates/pipes/format-date-time/format-datetime.pipe';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
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
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  CertificateEditComponent,
} from 'app/pages/credentials/certificates-dash/certificate-edit/certificate-edit.component';
import { certificateListElements } from 'app/pages/credentials/certificates-dash/certificate-list/certificate-list.elements';
import {
  ImportCertificateComponent,
} from 'app/pages/credentials/certificates-dash/import-certificate/import-certificate.component';
import { DownloadService } from 'app/services/download.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-certificate-list',
  templateUrl: './certificate-list.component.html',
  styleUrls: ['./certificate-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    MatToolbarRow,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    UiSearchDirective,
    MatCardContent,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTableCellDirective,
    IxTablePagerShowMoreComponent,
    TranslateModule,
    FormatDateTimePipe,
    AsyncPipe,
  ],
})
export class CertificateListComponent {
  private api = inject(ApiService);
  private slideIn = inject(SlideIn);
  private translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);
  protected emptyService = inject(EmptyService);
  private download = inject(DownloadService);
  private dialogService = inject(DialogService);
  private errorHandler = inject(ErrorHandlerService);

  readonly certificates = input<Certificate[]>([]);
  readonly isLoading = input<boolean>(false);

  readonly certificatesUpdated = output();

  protected readonly requiredRoles = [Role.CertificateWrite];
  protected readonly searchableElements = certificateListElements;

  dataProvider = new ArrayDataProvider<Certificate>();

  columns = createTable<Certificate>([
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
    actionsWithMenuColumn({
      actions: [
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
    uniqueRowTag: (row) => 'cert-' + row.name,
    ariaLabels: (row) => [row.name, this.translate.instant('Certificate')],
  });

  constructor() {
    this.setDefaultSort();

    effect(() => {
      const certificates = this.certificates();
      this.dataProvider.setRows(certificates);
      if (this.isLoading()) {
        this.dataProvider.setEmptyType(EmptyType.Loading);
      } else {
        this.dataProvider.setEmptyType(certificates.length ? EmptyType.NoSearchResults : EmptyType.NoPageData);
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

  protected doImport(): void {
    this.slideIn.open(ImportCertificateComponent).pipe(
      filter((response) => !!response.response),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.certificatesUpdated.emit();
    });
  }

  protected doEdit(certificate: Certificate): void {
    this.slideIn.open(CertificateEditComponent, {
      wide: true,
      data: certificate,
    }).pipe(
      filter((response) => !!response.response),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.certificatesUpdated.emit();
    });
  }

  protected doDelete(certificate: Certificate): void {
    this.dialogService.confirm({
      title: this.translate.instant('Delete Certificate'),
      message: this.translate.instant('Are you sure you want to delete "{name}"?', { name: certificate.name }),
      hideCheckbox: true,
      secondaryCheckbox: true,
      buttonColor: 'warn',
      secondaryCheckboxText: this.translate.instant('Force'),
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
    ).subscribe(() => {
      this.certificatesUpdated.emit();
    });
  }

  protected doDownload(certificate: Certificate): void {
    const isCsr = certificate.cert_type_CSR;
    const path = isCsr ? certificate.csr_path : certificate.certificate_path;
    const fileName = `${certificate.name}.${isCsr ? 'csr' : 'crt'}`;

    this.download.coreDownload({
      fileName,
      method: 'filesystem.get',
      arguments: [path],
      mimeType: 'application/x-x509-user-cert',
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
}
