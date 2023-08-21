import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  BehaviorSubject, Observable, combineLatest, switchMap, of, filter,
} from 'rxjs';
import { EmptyType } from 'app/enums/empty-type.enum';
import { CloudsyncCredential } from 'app/interfaces/cloudsync-credential.interface';
import { ArrayDataProvider } from 'app/modules/ix-table2/array-data-provider';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { SortDirection } from 'app/modules/ix-table2/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table2/utils';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { CloudCredentialsFormComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/cloud-credentials-form.component';
import { CloudCredentialService } from 'app/services/cloud-credential.service';
import { DialogService } from 'app/services/dialog.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-cloud-credentials-card',
  templateUrl: './cloud-credentials-card.component.html',
  styleUrls: ['./cloud-credentials-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CloudCredentialService],
})
export class CloudCredentialsCardComponent implements OnInit {
  dataProvider = new ArrayDataProvider<CloudsyncCredential>();
  providers = new Map<string, string>();
  credentials: CloudsyncCredential[] = [];
  columns = createTable<CloudsyncCredential>([
    textColumn({
      title: this.translate.instant('Name'),
      propertyName: 'name',
      sortable: true,
    }),
    textColumn({
      title: this.translate.instant('Provider'),
      propertyName: 'provider',
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
    private cloudCredentialService: CloudCredentialService,
  ) {}

  ngOnInit(): void {
    this.getProviders();
    this.getCredentials();
  }

  getCredentials(): void {
    this.ws
      .call('cloudsync.credentials.query')
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

  getProviders(): void {
    this.cloudCredentialService.getProviders().pipe(untilDestroyed(this)).subscribe((providers) => {
      providers.forEach((provider) => this.providers.set(provider.name, provider.title));
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
    const slideInRef = this.slideInService.open(CloudCredentialsFormComponent);
    slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.getCredentials();
    });
  }

  doEdit(credential: CloudsyncCredential): void {
    const slideInRef = this.slideInService.open(CloudCredentialsFormComponent, { data: credential });
    slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.getCredentials();
    });
  }

  doDelete(credential: CloudsyncCredential): void {
    this.dialog
      .confirm({
        title: this.translate.instant('Delete Cloud Credential'),
        message: this.translate.instant('Are you sure you want to delete the <b>{name}</b>?', {
          name: credential.name,
        }),
        buttonText: this.translate.instant('Delete'),
      })
      .pipe(
        filter(Boolean),
        switchMap(() => this.ws.call('cloudsync.credentials.delete', [credential.id])),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.getCredentials();
      });
  }
}
