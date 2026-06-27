import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject } from '@angular/core';
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
import { filter, map, Observable, switchMap, tap } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { KeychainCredentialUsedBy, KeychainSshKeyPair } from 'app/interfaces/keychain-credential.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IconActionConfig } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';
import { IxTablePagerShowMoreComponent } from 'app/modules/ix-table/components/ix-table-pager-show-more/ix-table-pager-show-more.component';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { LoaderService } from 'app/modules/loader/loader.service';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { TableActionsCellComponent } from 'app/modules/tn-table-cells/actions-cell/table-actions-cell.component';
import { ignoreTranslation } from 'app/modules/translate/translate.helper';
import { ApiService } from 'app/modules/websocket/api.service';
import { sshKeypairsCardElements } from 'app/pages/credentials/backup-credentials/ssh-keypair-card/ssh-keypair-card.elements';
import {
  SshKeypairFormComponent,
} from 'app/pages/credentials/backup-credentials/ssh-keypair-form/ssh-keypair-form.component';
import { DownloadService } from 'app/services/download.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { KeychainCredentialService } from 'app/services/keychain-credential.service';

@Component({
  selector: 'ix-ssh-keypair-card',
  templateUrl: './ssh-keypair-card.component.html',
  styleUrls: ['./ssh-keypair-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
export class SshKeypairCardComponent implements OnInit {
  private api = inject(ApiService);
  private formPanel = inject(FormSidePanelService);
  private emptyService = inject(EmptyService);
  private translate = inject(TranslateService);
  private dialog = inject(DialogService);
  private keychainCredentialService = inject(KeychainCredentialService);
  private download = inject(DownloadService);
  private errorHandler = inject(ErrorHandlerService);
  private loader = inject(LoaderService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.KeychainCredentialWrite];
  protected readonly searchableElements = sshKeypairsCardElements;

  protected readonly dataProvider = new AsyncDataProvider<KeychainSshKeyPair>(
    this.keychainCredentialService.getSshKeys().pipe(takeUntilDestroyed(this.destroyRef)),
  );

  protected readonly currentPage = toSignal(this.dataProvider.currentPage$, {
    initialValue: [] as KeychainSshKeyPair[],
  });

  protected readonly isLoading = toSignal(this.dataProvider.isLoading$, { initialValue: false });

  protected readonly isEmpty = computed(() => !this.currentPage().length && !this.isLoading());

  private emptyType = toSignal(this.dataProvider.emptyType$);

  // Reflects the data-provider's state (error / no data / no search results) so the empty state
  // shows the correct title — not a static "no records" message when the query actually failed.
  protected readonly emptyConfig = computed(() => this.emptyService.defaultEmptyConfig(this.emptyType()));

  protected readonly displayedColumns = ['name', 'actions'];

  protected readonly trackById = (_index: number, row: KeychainSshKeyPair): number => row.id;

  protected readonly actions: IconActionConfig<KeychainSshKeyPair>[] = [
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
      tooltip: this.translate.instant('Delete'),
      requiredRoles: this.requiredRoles,
      onClick: (row) => this.doDelete(row),
    },
  ];

  protected uniqueRowTag(row: KeychainSshKeyPair): string {
    return 'ssh-keypair-' + row.name;
  }

  protected ariaLabel(row: KeychainSshKeyPair): string {
    return [row.name, this.translate.instant('SSH Key Pair')].join(' ');
  }

  ngOnInit(): void {
    this.setDefaultSort();
    this.getCredentials();

    this.keychainCredentialService.refetchSshKeys
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.getCredentials());
  }

  private getCredentials(): void {
    this.dataProvider.load();
  }

  private setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 1,
      direction: SortDirection.Asc,
      propertyName: 'id',
    });
  }

  protected doAdd(): void {
    this.formPanel.open(SshKeypairFormComponent, {
      title: this.translate.instant('Add SSH Keypair'),
    }).onSuccess(() => this.getCredentials(), this.destroyRef);
  }

  protected doEdit(credential: KeychainSshKeyPair): void {
    this.formPanel.open(SshKeypairFormComponent, {
      title: this.translate.instant('Edit SSH Keypair'),
      inputs: { editKeypair: credential },
    }).onSuccess(() => this.getCredentials(), this.destroyRef);
  }

  protected doDelete(credential: KeychainSshKeyPair): void {
    this.checkKeypairUsage(credential.id).pipe(
      switchMap((usedBy) => {
        return this.confirmDeletion(credential.name, usedBy).pipe(
          map((confirmed) => ({ confirmed, hasAssociatedItems: usedBy.length > 0 })),
        );
      }),
      filter(({ confirmed }) => confirmed),
      switchMap(({ hasAssociatedItems }) => this.deleteKeypair(credential.id, hasAssociatedItems)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.getCredentials();
    });
  }

  private checkKeypairUsage(keypairId: number): Observable<KeychainCredentialUsedBy[]> {
    return this.api.call('keychaincredential.used_by', [keypairId]).pipe(
      this.loader.withLoader(),
    );
  }

  private confirmDeletion(
    name: string,
    usedBy: KeychainCredentialUsedBy[],
  ): Observable<boolean> {
    if (usedBy.length > 0) {
      const itemsList = usedBy.map((item) => item.title).join('<br>• ');
      const message = ignoreTranslation(
        this.translate.instant(
          'The SSH Keypair <b>{name}</b> is being used by the following:<br><br>• {items}<br><br>Deleting it will also delete all associated SSH connections.',
          { name, items: itemsList },
        ),
      );

      return this.dialog.confirm({
        title: this.translate.instant('Delete SSH Keypair'),
        message,
        buttonColor: 'warn',
        buttonText: this.translate.instant('Delete'),
      });
    }

    return this.dialog.confirm({
      title: this.translate.instant('Delete SSH Keypair'),
      message: this.translate.instant('Are you sure you want to delete the <b>{name}</b>?', { name }),
      buttonColor: 'warn',
      buttonText: this.translate.instant('Delete'),
    });
  }

  private deleteKeypair(
    keypairId: number,
    hasAssociatedConnections: boolean,
  ): Observable<void> {
    // Automatically cascade delete when keypair has associated connections
    const cascade = hasAssociatedConnections;

    return this.api.call('keychaincredential.delete', [keypairId, { cascade }]).pipe(
      tap(() => {
        if (cascade) {
          this.keychainCredentialService.refetchSshConnections.next();
        }
      }),
      this.loader.withLoader(),
      this.errorHandler.withErrorHandler(),
    );
  }

  protected doDownload(credential: KeychainSshKeyPair): void {
    const name = credential.name;
    Object.keys(credential.attributes).forEach((keyType) => {
      const key = credential.attributes[keyType as keyof typeof credential.attributes];
      const blob = new Blob([key as BlobPart], { type: 'text/plain' });
      this.download.downloadBlob(blob, `${name}_${keyType}_rsa`);
    });
  }
}
