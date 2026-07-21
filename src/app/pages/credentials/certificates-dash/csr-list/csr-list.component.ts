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
  type TnSortEvent,
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
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { ArrayDataProvider } from 'app/modules/ix-table/classes/array-data-provider/array-data-provider';
import { IconActionConfig } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';
import { IxTablePagerShowMoreComponent } from 'app/modules/ix-table/components/ix-table-pager-show-more/ix-table-pager-show-more.component';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { mapTnSortToTableSort } from 'app/modules/ix-table/utils';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import {
  TableActionsCellComponent,
} from 'app/modules/tn-table-cells/actions-cell/table-actions-cell.component';
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
    UiSearchDirective,
    RequiresRolesDirective,
    TranslateModule,
    AsyncPipe,
  ],
})
export class CertificateSigningRequestsListComponent {
  private api = inject(ApiService);
  private formPanel = inject(FormSidePanelService);
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

  protected dataProvider = new ArrayDataProvider<Certificate>();

  // The CN column aggregates CN + SAN; key it on `common` (the property master sorted by).
  protected readonly displayedColumns = ['name', 'common', 'actions'];

  protected readonly trackBy = (_: number, row: Certificate): number => row.id;

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider.setSorting(mapTnSortToTableSort<Certificate>(event, this.displayedColumns));
  }

  protected readonly actions: IconActionConfig<Certificate>[] = [
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
  ];

  protected uniqueRowTag(row: Certificate): string {
    return 'csr-' + row.name;
  }

  protected ariaLabel(row: Certificate): string {
    return [row.name, this.translate.instant('CSR')].join(' ');
  }

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

  protected doAdd(): void {
    // Footerless: the CSR wizard owns its own Next/Back/Save inside the stepper steps.
    this.formPanel.open(CsrAddComponent, {
      title: this.translate.instant('Add CSR'),
      footerless: true,
    }).onSuccess(() => this.csrsUpdated.emit(), this.destroyRef);
  }

  private doEdit(certificate: Certificate): void {
    this.formPanel.open(CertificateEditComponent, {
      wide: true,
      title: certificate.cert_type_CSR
        ? this.translate.instant('Edit CSR')
        : this.translate.instant('Edit Certificate'),
      inputs: { editingCertificate: certificate },
    }).onSuccess(() => this.csrsUpdated.emit(), this.destroyRef);
  }

  private doDelete(certificate: Certificate): void {
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

  private doDownload(certificate: Certificate): void {
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
    this.formPanel.open(CertificateAcmeAddComponent, {
      title: this.translate.instant('Create ACME Certificate'),
      inputs: { csr },
    }).onSuccess(() => this.csrsUpdated.emit(), this.destroyRef);
  }
}
