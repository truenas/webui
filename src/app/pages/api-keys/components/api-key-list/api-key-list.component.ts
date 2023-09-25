import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { combineLatest, Observable, of } from 'rxjs';
import {
  filter, map, switchMap,
} from 'rxjs/operators';
import { EmptyType } from 'app/enums/empty-type.enum';
import { ApiKey } from 'app/interfaces/api-key.interface';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { ApiKeyFormDialogComponent } from 'app/pages/api-keys/components/api-key-form-dialog/api-key-form-dialog.component';
import { ApiKeyComponentStore } from 'app/pages/api-keys/store/api-key.store';
import { DialogService } from 'app/services/dialog.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './api-key-list.component.html',
  styleUrls: ['./api-key-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApiKeyListComponent implements OnInit {
  @ViewChild(MatSort, { static: false }) sort: MatSort;

  displayedColumns: string[] = ['name', 'created_at', 'actions'];
  dataSource = new MatTableDataSource<ApiKey>([]);
  defaultSort: Sort = { active: 'name', direction: 'asc' };
  filterValue = '';
  loadingConfig: EmptyConfig = {
    type: EmptyType.Loading,
    large: false,
    title: this.translate.instant('Loading...'),
  };

  readonly EmptyType = EmptyType;
  isLoading$ = this.store.isLoading$;
  emptyType$: Observable<EmptyType> = combineLatest([
    this.isLoading$,
    this.store.isError$,
    this.store.apiKeys$.pipe(
      map((apiKeys) => apiKeys?.length === 0),
    ),
  ]).pipe(
    switchMap(([isLoading, isError, isNoData]) => {
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

  get emptyConfigService(): EmptyService {
    return this.emptyService;
  }

  constructor(
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private store: ApiKeyComponentStore,
    private matDialog: MatDialog,
    private dialog: DialogService,
    private ws: WebSocketService,
    private emptyService: EmptyService,
  ) { }

  ngOnInit(): void {
    this.getApiKeys();
  }

  getApiKeys(): void {
    this.store.loadApiKeys();
    this.store.apiKeys$.pipe(
      untilDestroyed(this),
    ).subscribe({
      next: (apiKeys) => {
        this.createDataSource(apiKeys);
        this.cdr.markForCheck();
      },
      error: () => {
        this.createDataSource();
        this.cdr.markForCheck();
      },
    });
  }

  openApiKeyForm(row?: ApiKey): void {
    this.matDialog
      .open(ApiKeyFormDialogComponent, { data: row })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe();
  }

  doDelete(apiKey: ApiKey): void {
    this.dialog.confirm({
      title: this.translate.instant('Delete API Key'),
      message: this.translate.instant('Are you sure you want to delete the <b>{name}</b> API Key?', { name: apiKey.name }),
      buttonText: this.translate.instant('Delete'),
      cancelText: this.translate.instant('Cancel'),
    }).pipe(
      filter(Boolean),
      switchMap(() => this.ws.call('api_key.delete', [String(apiKey.id)])),
      untilDestroyed(this),
    ).subscribe(() => {
      this.store.apiKeyDeleted(apiKey.id);
    });
  }

  private createDataSource(apiKeys: ApiKey[] = []): void {
    this.dataSource = new MatTableDataSource(apiKeys);
    this.dataSource.sort = this.sort;
    this.dataSource.sortingDataAccessor = (item, property: 'name' | 'created_at') => {
      if (property === 'name') {
        return item.name;
      }

      return item.created_at.$date;
    };
    this.store.patchState({ isLoading: false });
    this.cdr.markForCheck();
  }

  onSearch(filterString: string): void {
    this.dataSource.filter = filterString;
  }
}
