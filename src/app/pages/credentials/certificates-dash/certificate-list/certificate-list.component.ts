import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, effect, input, output, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  tnIconMarker,
  TnButtonComponent,
  TnCardComponent,
  TnCardFooterActionsDirective,
  TnCellDefDirective,
  TnEmptyComponent,
  TnHeaderCellDefDirective,
  TnTableColumnDirective,
  TnTableComponent,
} from '@truenas/ui-components';
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
import { ArrayDataProvider } from 'app/modules/ix-table/classes/array-data-provider/array-data-provider';
import { IconActionConfig } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';
import { IxTablePagerShowMoreComponent } from 'app/modules/ix-table/components/ix-table-pager-show-more/ix-table-pager-show-more.component';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import {
  TableActionsCellComponent,
} from 'app/modules/tn-table-cells/actions-cell/table-actions-cell.component';
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
    TnCardComponent,
    TnCardFooterActionsDirective,
    TnButtonComponent,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TnEmptyComponent,
    TableActionsCellComponent,
    IxTablePagerShowMoreComponent,
    RequiresRolesDirective,
    UiSearchDirective,
    TranslateModule,
    FormatDateTimePipe,
    AsyncPipe,
  ],
})
export class CertificateListComponent {
  private api = inject(ApiService);
  private formPanel = inject(FormSidePanelService);
  private translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);
  protected emptyService = inject(EmptyService);
  private download = inject(DownloadService);
  private dialogService = inject(DialogService);
  private errorHandler = inject(ErrorHandlerService);
  private snackbar = inject(SnackbarService);

  readonly certificates = input<Certificate[]>([]);
  readonly isLoading = input<boolean>(false);

  readonly certificatesUpdated = output();

  protected readonly requiredRoles = [Role.CertificateWrite];
  protected readonly searchableElements = certificateListElements;

  protected dataProvider = new ArrayDataProvider<Certificate>();

  protected readonly displayedColumns = ['name', 'date', 'cn', 'actions'];

  protected readonly trackBy = (_: number, row: Certificate): number => row.id;

  protected readonly actions: IconActionConfig<Certificate>[] = [
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
  ];

  protected uniqueRowTag(row: Certificate): string {
    return 'cert-' + row.name;
  }

  protected ariaLabel(row: Certificate): string {
    return [row.name, this.translate.instant('Certificate')].join(' ');
  }

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
    this.formPanel.open(ImportCertificateComponent, {
      title: this.translate.instant('Import Certificate'),
    }).onSuccess(() => this.certificatesUpdated.emit(), this.destroyRef);
  }

  protected doEdit(certificate: Certificate): void {
    this.formPanel.open(CertificateEditComponent, {
      wide: true,
      title: certificate.cert_type_CSR
        ? this.translate.instant('Edit CSR')
        : this.translate.instant('Edit Certificate'),
      inputs: { editingCertificate: certificate },
    }).onSuccess(() => this.certificatesUpdated.emit(), this.destroyRef);
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
    ).subscribe({
      next: () => {
        this.snackbar.success(this.translate.instant('Certificate deleted'));
        this.certificatesUpdated.emit();
      },
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
