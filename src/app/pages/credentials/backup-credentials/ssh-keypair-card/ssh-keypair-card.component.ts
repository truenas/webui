import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  BehaviorSubject, Observable, combineLatest, switchMap, of, filter,
} from 'rxjs';
import { EmptyType } from 'app/enums/empty-type.enum';
import { KeychainCredential, KeychainSshKeyPair } from 'app/interfaces/keychain-credential.interface';
import { ArrayDataProvider } from 'app/modules/ix-table2/array-data-provider';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { SortDirection } from 'app/modules/ix-table2/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table2/utils';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { SshKeypairFormComponent } from 'app/pages/credentials/backup-credentials/ssh-keypair-form/ssh-keypair-form.component';
import { DialogService } from 'app/services/dialog.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { KeychainCredentialService } from 'app/services/keychain-credential.service';
import { StorageService } from 'app/services/storage.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-ssh-keypair-card',
  templateUrl: './ssh-keypair-card.component.html',
  styleUrls: ['./ssh-keypair-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SshKeypairCardComponent implements OnInit {
  dataProvider = new ArrayDataProvider<KeychainSshKeyPair>();
  credentials: KeychainSshKeyPair[] = [];
  columns = createTable<KeychainSshKeyPair>([
    textColumn({
      title: this.translate.instant('Name'),
      propertyName: 'name',
      sortable: true,
    }),
    textColumn({
      propertyName: 'id',
    }),
  ]);

  isLoading$ = new BehaviorSubject<boolean>(true);
  isNoData$ = new BehaviorSubject<boolean>(false);
  hasError$ = new BehaviorSubject<boolean>(false);
  emptyType$: Observable<EmptyType> = combineLatest([this.isLoading$, this.isNoData$, this.hasError$]).pipe(
    switchMap(([isLoading, isNoData, isError]) => {
      if (isLoading) {
        return of(EmptyType.Loading);
      }
      if (isError) {
        return of(EmptyType.Errors);
      }
      if (isNoData) {
        return of(EmptyType.NoPageData);
      }
      return of(EmptyType.NoSearchResults);
    }),
  );

  constructor(
    private ws: WebSocketService,
    private slideInService: IxSlideInService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    protected emptyService: EmptyService,
    private dialog: DialogService,
    private keychainCredentialService: KeychainCredentialService,
    private storage: StorageService,
  ) {}

  ngOnInit(): void {
    this.getCredentials();
  }

  getCredentials(): void {
    this.keychainCredentialService.getSshKeys()
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (credentials) => {
          this.credentials = credentials;
          this.dataProvider.setRows(this.credentials);
          this.isLoading$.next(false);
          this.isNoData$.next(!this.credentials.length);
          this.setDefaultSort();
          this.cdr.markForCheck();
        },
        error: () => {
          this.dataProvider.setRows([]);
          this.isLoading$.next(false);
          this.hasError$.next(true);
          this.cdr.markForCheck();
        },
      });
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
      this.storage.downloadBlob(blob, `${name}_${keyType}_rsa`);
    });
  }
}
