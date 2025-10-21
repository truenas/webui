import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatToolbarRow } from '@angular/material/toolbar';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { filter, map, Observable, switchMap, tap } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { KeychainSshKeyPair } from 'app/interfaces/keychain-credential.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { actionsWithMenuColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions-with-menu/ix-cell-actions-with-menu.component';
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
import { ApiService } from 'app/modules/websocket/api.service';
import { sshKeypairsCardElements } from 'app/pages/credentials/backup-credentials/ssh-keypair-card/ssh-keypair-card.elements';
import {
  SshKeypairFormComponent,
} from 'app/pages/credentials/backup-credentials/ssh-keypair-form/ssh-keypair-form.component';
import { DownloadService } from 'app/services/download.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { KeychainCredentialService } from 'app/services/keychain-credential.service';

@UntilDestroy()
@Component({
  selector: 'ix-ssh-keypair-card',
  templateUrl: './ssh-keypair-card.component.html',
  styleUrls: ['./ssh-keypair-card.component.scss'],
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
export class SshKeypairCardComponent implements OnInit {
  private api = inject(ApiService);
  private slideIn = inject(SlideIn);
  private translate = inject(TranslateService);
  protected emptyService = inject(EmptyService);
  private dialog = inject(DialogService);
  private keychainCredentialService = inject(KeychainCredentialService);
  private download = inject(DownloadService);
  private errorHandler = inject(ErrorHandlerService);
  private loader = inject(LoaderService);

  protected readonly requiredRoles = [Role.KeychainCredentialWrite];
  protected readonly searchableElements = sshKeypairsCardElements;

  dataProvider: AsyncDataProvider<KeychainSshKeyPair>;
  credentials: KeychainSshKeyPair[] = [];
  columns = createTable<KeychainSshKeyPair>([
    textColumn({
      title: this.translate.instant('Name'),
      propertyName: 'name',
    }),
    actionsWithMenuColumn({
      actions: [
        {
          iconName: iconMarker('save_alt'),
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
          tooltip: this.translate.instant('Delete'),
          requiredRoles: this.requiredRoles,
          onClick: (row) => this.doDelete(row),
        },
      ],
    }),
  ], {
    uniqueRowTag: (row) => 'ssh-keypair-' + row.name,
    ariaLabels: (row) => [row.name, this.translate.instant('SSH Key Pair')],
  });

  ngOnInit(): void {
    const credentials$ = this.keychainCredentialService.getSshKeys().pipe(
      tap((credentials) => this.credentials = credentials),
      untilDestroyed(this),
    );
    this.dataProvider = new AsyncDataProvider<KeychainSshKeyPair>(credentials$);
    this.setDefaultSort();
    this.getCredentials();

    this.keychainCredentialService.refetchSshKeys
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

  doAdd(): void {
    this.slideIn.open(SshKeypairFormComponent).pipe(
      filter((response) => !!response.response),
      untilDestroyed(this),
    ).subscribe(() => {
      this.getCredentials();
    });
  }

  doEdit(credential: KeychainSshKeyPair): void {
    this.slideIn.open(SshKeypairFormComponent, { data: credential }).pipe(
      filter((response) => !!response.response),
      untilDestroyed(this),
    ).subscribe(() => {
      this.getCredentials();
    });
  }

  doDelete(credential: KeychainSshKeyPair): void {
    this.checkKeypairUsage(credential.id).pipe(
      switchMap((hasAssociatedConnections) => {
        return this.confirmDeletion(credential.name, hasAssociatedConnections).pipe(
          map((confirmed) => ({ confirmed, hasAssociatedConnections })),
        );
      }),
      filter(({ confirmed }) => confirmed),
      switchMap(({ hasAssociatedConnections }) => this.deleteKeypair(credential.id, hasAssociatedConnections)),
      untilDestroyed(this),
    ).subscribe(() => {
      this.getCredentials();
    });
  }

  private checkKeypairUsage(keypairId: number): Observable<boolean> {
    return this.api.call('keychaincredential.used_by', [keypairId]).pipe(
      map((usedBy) => usedBy.length > 0),
      this.loader.withLoader(),
    );
  }

  private confirmDeletion(
    name: string,
    hasAssociatedConnections: boolean,
  ): Observable<boolean> {
    const message = hasAssociatedConnections
      ? this.translate.instant(
        'The SSH Keypair <b>{name}</b> is being used by SSH Connections.<br>Deleting it will also delete all associated SSH Connections.',
        { name },
      )
      : this.translate.instant('Are you sure you want to delete the <b>{name}</b>?', { name });

    return this.dialog.confirm({
      title: this.translate.instant('Delete SSH Keypair'),
      message,
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

  doDownload(credential: KeychainSshKeyPair): void {
    const name = credential.name;
    Object.keys(credential.attributes).forEach((keyType) => {
      const key = credential.attributes[keyType as keyof typeof credential.attributes];
      const blob = new Blob([key as BlobPart], { type: 'text/plain' });
      this.download.downloadBlob(blob, `${name}_${keyType}_rsa`);
    });
  }
}
