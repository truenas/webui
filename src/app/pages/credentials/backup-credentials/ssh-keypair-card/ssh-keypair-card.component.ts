import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter, switchMap, tap } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { KeychainCredential, KeychainSshKeyPair } from 'app/interfaces/keychain-credential.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import {
  actionsColumn,
} from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table/utils';
import { sshKeypairsCardElements } from 'app/pages/credentials/backup-credentials/ssh-keypair-card/ssh-keypair-card.elements';
import {
  SshKeypairFormComponent,
} from 'app/pages/credentials/backup-credentials/ssh-keypair-form/ssh-keypair-form.component';
import { DownloadService } from 'app/services/download.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { KeychainCredentialService } from 'app/services/keychain-credential.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-ssh-keypair-card',
  templateUrl: './ssh-keypair-card.component.html',
  styleUrls: ['./ssh-keypair-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SshKeypairCardComponent implements OnInit {
  protected readonly requiredRoles = [Role.KeychainCredentialWrite];
  protected readonly searchableElements = sshKeypairsCardElements;

  dataProvider: AsyncDataProvider<KeychainSshKeyPair>;
  credentials: KeychainSshKeyPair[] = [];
  columns = createTable<KeychainSshKeyPair>([
    textColumn({
      title: this.translate.instant('Name'),
      propertyName: 'name',
    }),
    actionsColumn({
      actions: [
        {
          iconName: 'save_alt',
          tooltip: this.translate.instant('Download'),
          onClick: (row) => this.doDownload(row),
        },
        {
          iconName: 'edit',
          tooltip: this.translate.instant('Edit'),
          onClick: (row) => this.doEdit(row),
        },
        {
          iconName: 'delete',
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

  constructor(
    private ws: WebSocketService,
    private slideInService: IxSlideInService,
    private translate: TranslateService,
    protected emptyService: EmptyService,
    private dialog: DialogService,
    private keychainCredentialService: KeychainCredentialService,
    private download: DownloadService,
  ) {}

  ngOnInit(): void {
    const credentials$ = this.keychainCredentialService.getSshKeys().pipe(
      tap((credentials) => this.credentials = credentials),
      untilDestroyed(this),
    );
    this.dataProvider = new AsyncDataProvider<KeychainSshKeyPair>(credentials$);
    this.setDefaultSort();
    this.getCredentials();
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
    const slideInRef = this.slideInService.open(SshKeypairFormComponent);
    slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.getCredentials();
    });
  }

  doEdit(credential: KeychainSshKeyPair): void {
    const slideInRef = this.slideInService.open(SshKeypairFormComponent, { data: credential });
    slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.getCredentials();
    });
  }

  doDelete(credential: KeychainSshKeyPair): void {
    this.dialog
      .confirm({
        title: this.translate.instant('Delete SSH Keypair'),
        message: this.translate.instant('Are you sure you want to delete the <b>{name}</b>?', {
          name: credential.name,
        }),
        buttonText: this.translate.instant('Delete'),
      })
      .pipe(
        filter(Boolean),
        switchMap(() => this.ws.call('keychaincredential.delete', [credential.id])),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.getCredentials();
      });
  }

  doDownload(credential: KeychainSshKeyPair): void {
    const name = credential.name;
    Object.keys(credential.attributes).forEach((keyType) => {
      const key = credential.attributes[keyType as keyof KeychainCredential['attributes']];
      const blob = new Blob([key as BlobPart], { type: 'text/plain' });
      this.download.downloadBlob(blob, `${name}_${keyType}_rsa`);
    });
  }
}
