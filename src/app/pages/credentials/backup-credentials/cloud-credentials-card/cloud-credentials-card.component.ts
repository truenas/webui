import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, Type, computed, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent,
  TnCardComponent,
  TnCardFooterActionsDirective,
  TnCellDefDirective,
  TnEmptyComponent,
  TnHeaderCellDefDirective,
  tnIconMarker,
  TnTableColumnDirective,
  TnTableComponent,
  TnTestIdDirective,
  TnTooltipDirective,
} from '@truenas/ui-components';
import {
  tap, Observable,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { CloudSyncCredential } from 'app/interfaces/cloudsync-credential.interface';
import { CloudSyncProvider } from 'app/interfaces/cloudsync-provider.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IconActionConfig } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';
import { IxTablePagerShowMoreComponent } from 'app/modules/ix-table/components/ix-table-pager-show-more/ix-table-pager-show-more.component';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { TableActionsCellComponent } from 'app/modules/tn-table-cells/actions-cell/table-actions-cell.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { cloudCredentialsCardElements } from 'app/pages/credentials/backup-credentials/cloud-credentials-card/cloud-credentials-card.elements';
import { CloudCredentialFormInput, CloudCredentialsFormComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/cloud-credentials-form.component';
import { CloudCredentialService } from 'app/services/cloud-credential.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-cloud-credentials-card',
  templateUrl: './cloud-credentials-card.component.html',
  styleUrls: ['./cloud-credentials-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CloudCredentialService],
  imports: [
    TnCardComponent,
    TnCardFooterActionsDirective,
    UiSearchDirective,
    RequiresRolesDirective,
    TnButtonComponent,
    TnEmptyComponent,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TnTestIdDirective,
    TnTooltipDirective,
    TableActionsCellComponent,
    IxTablePagerShowMoreComponent,
    TranslateModule,
  ],
})
export class CloudCredentialsCardComponent implements OnInit {
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private formPanel = inject(FormSidePanelService);
  private dialog = inject(DialogService);
  private cloudCredentialService = inject(CloudCredentialService);
  private errorHandler = inject(ErrorHandlerService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.CloudSyncWrite];
  protected readonly searchableElements = cloudCredentialsCardElements;

  protected readonly dataProvider = new AsyncDataProvider<CloudSyncCredential>(
    this.api.call('cloudsync.credentials.query').pipe(takeUntilDestroyed(this.destroyRef)),
  );

  protected readonly currentPage = toSignal(this.dataProvider.currentPage$, {
    initialValue: [] as CloudSyncCredential[],
  });

  protected readonly isLoading = toSignal(this.dataProvider.isLoading$, { initialValue: false });

  protected readonly isEmpty = computed(() => !this.currentPage().length && !this.isLoading());

  private providers = new Map<string, string>();

  protected readonly displayedColumns = ['name', 'provider', 'actions'];

  protected readonly trackById = (_index: number, row: CloudSyncCredential): number => row.id;

  protected readonly actions: IconActionConfig<CloudSyncCredential>[] = [
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

  protected uniqueRowTag(row: CloudSyncCredential): string {
    return 'cloud-cred-' + row.name;
  }

  protected ariaLabel(row: CloudSyncCredential): string {
    return [row.name, this.translate.instant('Cloud Credential')].join(' ');
  }

  protected getProviderName(row: CloudSyncCredential): string {
    const provider = row.provider.type;
    return this.providers.get(provider) || provider;
  }

  ngOnInit(): void {
    this.setDefaultSort();

    this.getProviders()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.getCredentials();
      });
  }

  private getCredentials(): void {
    this.dataProvider.load();
  }

  private getProviders(): Observable<CloudSyncProvider[]> {
    return this.cloudCredentialService
      .getProviders()
      .pipe(
        tap((providers) => {
          providers.forEach((provider) => this.providers.set(provider.name, provider.title));
        }),
        this.errorHandler.withErrorHandler(),
      );
  }

  private setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 1,
      direction: SortDirection.Asc,
      propertyName: 'id',
    });
  }

  // CloudCredentialsFormComponent structurally provides the host surface
  // (closed/canSubmit/submit/hasUnsavedChanges/requiredRoles) the panel reads; cast past the
  // nominal base type, mirroring how FormSidePanelService.openForm casts the renderer.
  private readonly cloudForm = CloudCredentialsFormComponent as unknown as Type<SidePanelForm>;

  protected doAdd(): void {
    this.formPanel.open(this.cloudForm, {
      title: this.translate.instant('Add Cloud Credential'),
    }).onSuccess(() => this.getCredentials(), this.destroyRef);
  }

  protected doEdit(credential: CloudSyncCredential): void {
    this.formPanel.open(this.cloudForm, {
      title: this.translate.instant('Edit Cloud Credential'),
      inputs: {
        editInput: { existingCredential: credential } as CloudCredentialFormInput,
      },
    }).onSuccess(() => this.getCredentials(), this.destroyRef);
  }

  protected doDelete(credential: CloudSyncCredential): void {
    this.dialog
      .confirmDelete({
        title: this.translate.instant('Delete Cloud Credential'),
        message: this.translate.instant('Are you sure you want to delete the <b>{name}</b>?', {
          name: credential.name,
        }),
        call: () => this.api.call('cloudsync.credentials.delete', [credential.id]),
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.getCredentials();
      });
  }
}
