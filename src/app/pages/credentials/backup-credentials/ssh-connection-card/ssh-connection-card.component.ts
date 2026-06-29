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
import { filter, Observable, of, switchMap, tap } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { ConfirmOptionsWithSecondaryCheckbox, DialogWithSecondaryCheckboxResult } from 'app/interfaces/dialog.interface';
import { KeychainCredentialUsedBy, KeychainSshCredentials } from 'app/interfaces/keychain-credential.interface';
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
import { sshConnectionsCardElements } from 'app/pages/credentials/backup-credentials/ssh-connection-card/ssh-connection-card.elements';
import { SshConnectionFormComponent } from 'app/pages/credentials/backup-credentials/ssh-connection-form/ssh-connection-form.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { KeychainCredentialService } from 'app/services/keychain-credential.service';

@Component({
  selector: 'ix-ssh-connection-card',
  templateUrl: './ssh-connection-card.component.html',
  styleUrls: ['./ssh-connection-card.component.scss'],
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
export class SshConnectionCardComponent implements OnInit {
  private api = inject(ApiService);
  private formPanel = inject(FormSidePanelService);
  private emptyService = inject(EmptyService);
  private translate = inject(TranslateService);
  private dialog = inject(DialogService);
  private errorHandler = inject(ErrorHandlerService);
  private keychainCredentialService = inject(KeychainCredentialService);
  private loader = inject(LoaderService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.KeychainCredentialWrite];
  protected readonly searchableElements = sshConnectionsCardElements;

  protected readonly dataProvider = new AsyncDataProvider<KeychainSshCredentials>(
    this.keychainCredentialService.getSshConnections().pipe(takeUntilDestroyed(this.destroyRef)),
  );

  protected readonly currentPage = toSignal(this.dataProvider.currentPage$, {
    initialValue: [] as KeychainSshCredentials[],
  });

  protected readonly isLoading = toSignal(this.dataProvider.isLoading$, { initialValue: false });

  protected readonly isEmpty = computed(() => !this.currentPage().length && !this.isLoading());

  private emptyType = toSignal(this.dataProvider.emptyType$);

  // Reflects the data-provider's state (error / no data / no search results) so the empty state
  // shows the correct title/message — not a static "no records" message when the query failed.
  protected readonly emptyConfig = computed(() => this.emptyService.defaultEmptyConfig(this.emptyType()));

  // State icon for error / no-search states, falling back to the card's own icon for no-data.
  protected readonly emptyIcon = computed(
    () => this.emptyService.iconForTypeOrDefault(this.emptyType(), tnIconMarker('console-network-outline', 'mdi')),
  );

  protected readonly displayedColumns = ['name', 'actions'];

  protected readonly trackById = (_index: number, row: KeychainSshCredentials): number => row.id;

  protected readonly actions: IconActionConfig<KeychainSshCredentials>[] = [
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

  protected uniqueRowTag(row: KeychainSshCredentials): string {
    return 'ssh-con-' + row.name;
  }

  protected ariaLabel(row: KeychainSshCredentials): string {
    return [row.name, this.translate.instant('SSH Connection')].join(' ');
  }

  ngOnInit(): void {
    this.setDefaultSort();
    this.getCredentials();

    this.keychainCredentialService.refetchSshConnections
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.getCredentials());
  }

  private getCredentials(): void {
    this.dataProvider.load();
  }

  private setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: null,
      direction: SortDirection.Asc,
      propertyName: 'id',
    });
  }

  protected doAdd(): void {
    this.formPanel.open(SshConnectionFormComponent, {
      title: this.translate.instant('New SSH Connection'),
    }).onSuccess(() => this.getCredentials(), this.destroyRef);
  }

  protected doEdit(credential: KeychainSshCredentials): void {
    this.formPanel.open(SshConnectionFormComponent, {
      title: this.translate.instant('Edit SSH Connection'),
      inputs: { editConnection: credential },
    }).onSuccess(() => this.getCredentials(), this.destroyRef);
  }

  protected doDelete(credential: KeychainSshCredentials): void {
    const keypairId = credential.attributes.private_key;
    const hasAssociatedKeypair = !!keypairId;

    const usedBy$ = hasAssociatedKeypair
      ? this.api.call('keychaincredential.used_by', [keypairId]).pipe(this.loader.withLoader())
      : of([] as KeychainCredentialUsedBy[]);

    usedBy$.pipe(
      switchMap((usedBy: KeychainCredentialUsedBy[]) => {
        // Exclude the current connection from the list
        const otherItems = usedBy.filter((item) => item.title !== credential.name);
        return this.confirmConnectionDeletion(
          credential.name,
          hasAssociatedKeypair,
          otherItems,
        );
      }),
      filter((result) => result.confirmed),
      switchMap((result) => this.deleteConnection(
        credential.id,
        result.secondaryCheckbox ? keypairId : null,
      )),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.getCredentials();
    });
  }

  private confirmConnectionDeletion(
    name: string,
    hasAssociatedKeypair: boolean,
    otherItems: KeychainCredentialUsedBy[],
  ): Observable<DialogWithSecondaryCheckboxResult> {
    if (!hasAssociatedKeypair) {
      // No keypair, simple confirmation dialog
      return this.dialog.confirm({
        title: this.translate.instant('Delete SSH Connection'),
        message: this.translate.instant('Are you sure you want to delete the <b>{name}</b> SSH Connection?', { name }),
        buttonColor: 'warn',
        buttonText: this.translate.instant('Delete'),
      }).pipe(
        switchMap((confirmed) => of({ confirmed, secondaryCheckbox: false })),
      );
    }

    // Has keypair, show secondary checkbox
    const confirmOptions: ConfirmOptionsWithSecondaryCheckbox = {
      title: this.translate.instant('Delete SSH Connection'),
      message: this.translate.instant('Are you sure you want to delete the <b>{name}</b> SSH Connection?', { name }),
      buttonColor: 'warn',
      buttonText: this.translate.instant('Delete'),
      secondaryCheckbox: true,
      secondaryCheckboxText: this.translate.instant('Delete associated SSH Keypair'),
    };

    if (otherItems.length > 0) {
      const itemsList = otherItems.map((item) => item.title).join('<br>• ');
      confirmOptions.secondaryCheckboxMessage = ignoreTranslation(
        this.translate.instant(
          'The associated SSH Keypair is also used by:<br><br>• {items}<br><br>If you delete the keypair, all these SSH connections will also be deleted.',
          { items: itemsList },
        ),
      );
    }

    return this.dialog.confirm(confirmOptions) as unknown as Observable<DialogWithSecondaryCheckboxResult>;
  }

  private deleteConnection(connectionId: number, keypairId: number | null): Observable<void> {
    if (keypairId) {
      // Delete keypair with cascade, which will also delete the connection
      return this.api.call('keychaincredential.delete', [keypairId, { cascade: true }]).pipe(
        tap(() => this.keychainCredentialService.refetchSshKeys.next()),
        this.loader.withLoader(),
        this.errorHandler.withErrorHandler(),
      );
    }

    // Just delete the connection
    return this.api.call('keychaincredential.delete', [connectionId]).pipe(
      this.loader.withLoader(),
      this.errorHandler.withErrorHandler(),
    );
  }
}
