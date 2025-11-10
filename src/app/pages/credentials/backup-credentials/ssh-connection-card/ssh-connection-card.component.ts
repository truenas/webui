import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatToolbarRow } from '@angular/material/toolbar';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { filter, Observable, of, switchMap, tap } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { ConfirmOptionsWithSecondaryCheckbox, DialogWithSecondaryCheckboxResult } from 'app/interfaces/dialog.interface';
import { KeychainCredentialUsedBy, KeychainSshCredentials } from 'app/interfaces/keychain-credential.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { actionsColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerShowMoreComponent } from 'app/modules/ix-table/components/ix-table-pager-show-more/ix-table-pager-show-more.component';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table/utils';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ignoreTranslation } from 'app/modules/translate/translate.helper';
import { ApiService } from 'app/modules/websocket/api.service';
import { sshConnectionsCardElements } from 'app/pages/credentials/backup-credentials/ssh-connection-card/ssh-connection-card.elements';
import { SshConnectionFormComponent } from 'app/pages/credentials/backup-credentials/ssh-connection-form/ssh-connection-form.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { KeychainCredentialService } from 'app/services/keychain-credential.service';

@UntilDestroy()
@Component({
  selector: 'ix-ssh-connection-card',
  templateUrl: './ssh-connection-card.component.html',
  styleUrls: ['./ssh-connection-card.component.scss'],
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
    IxTablePagerShowMoreComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class SshConnectionCardComponent implements OnInit {
  private api = inject(ApiService);
  private slideIn = inject(SlideIn);
  private translate = inject(TranslateService);
  protected emptyService = inject(EmptyService);
  private dialog = inject(DialogService);
  private errorHandler = inject(ErrorHandlerService);
  private keychainCredentialService = inject(KeychainCredentialService);
  private loader = inject(LoaderService);

  protected readonly requiredRoles = [Role.KeychainCredentialWrite];
  protected readonly searchableElements = sshConnectionsCardElements;

  dataProvider: AsyncDataProvider<KeychainSshCredentials>;
  credentials: KeychainSshCredentials[] = [];
  columns = createTable<KeychainSshCredentials>([
    textColumn({
      title: this.translate.instant('Name'),
      propertyName: 'name',
    }),
    actionsColumn({
      actions: [
        {
          iconName: iconMarker('edit'),
          tooltip: this.translate.instant('Edit'),
          onClick: (row) => this.doEdit(row),
        },
        {
          iconName: iconMarker('mdi-delete'),
          tooltip: this.translate.instant('Delete'),
          requiredRoles: this.requiredRoles,
          onClick: (row) => this.doDelete(row),
        },
      ],
    }),
  ], {
    uniqueRowTag: (row) => 'ssh-con-' + row.name,
    ariaLabels: (row) => [row.name, this.translate.instant('SSH Connection')],
  });

  ngOnInit(): void {
    const credentials$ = this.keychainCredentialService.getSshConnections().pipe(
      tap((credentials) => this.credentials = credentials),
      untilDestroyed(this),
    );
    this.dataProvider = new AsyncDataProvider<KeychainSshCredentials>(credentials$);
    this.setDefaultSort();
    this.getCredentials();

    this.keychainCredentialService.refetchSshConnections
      .pipe(untilDestroyed(this))
      .subscribe(() => this.getCredentials());
  }

  getCredentials(): void {
    this.dataProvider.load();
  }

  setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 1,
      direction: SortDirection.Asc,
      propertyName: 'id',
    });
  }

  protected doAdd(): void {
    this.slideIn.open(SshConnectionFormComponent)
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => this.getCredentials());
  }

  protected doEdit(credential: KeychainSshCredentials): void {
    this.slideIn.open(SshConnectionFormComponent, { data: credential })
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => this.getCredentials());
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
      untilDestroyed(this),
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
